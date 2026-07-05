import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type EstadoPagoExterno = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

@Injectable()
export class PagoService {
  private static readonly ORIGIN_SERVICE = 'BIBLIOTECA';
  private static readonly DEFAULT_PAYMENT_METHOD = 'TARJETA';
  private static readonly PAYMENT_METHODS = [
    'TARJETA',
    'TRANSFERENCIA',
    'BILLETERA',
  ];

  private readonly logger = new Logger(PagoService.name);
  private readonly requestTimeoutMs = 30000;
  private readonly baseUrl: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('PAGOS_BASE_URL') || ''
    ).trim();
    this.privateKey = (
      this.configService.get<string>('PAGOS_PRIVATE_KEY') || ''
    ).trim();
  }

  private getErrorDetails(error: any) {
    return {
      status: error?.status,
      statusText: error?.statusText,
      data: error?.data,
      message: error?.message,
    };
  }

  private async requestPagos<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    const method = options.method || 'GET';

    try {
      this.logger.log(`[PAGOS][HTTP] ${method} ${path}`);

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;

      this.logger.log(
        `[PAGOS][HTTP] ${method} ${path} -> ${response.status} ${response.statusText}`,
      );

      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data,
          message: `Pagos respondio con estado ${response.status}`,
        };
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getTokenPago(): Promise<string> {
    try {
      if (!this.baseUrl || !this.privateKey) {
        throw new BadRequestException(
          'PAGOS_BASE_URL o PAGOS_PRIVATE_KEY no estan configurados',
        );
      }

      this.logger.log(
        `[PAGOS][1/3] Solicitando token en ${this.baseUrl}/v1/auth/token`,
      );

      const response = await this.requestPagos<{
        access_token: string;
        service?: string;
      }>('/v1/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          privateKey: this.privateKey,
        }),
      });

      this.logger.log(
        `[PAGOS][1/3] Token recibido para servicio ${response.service ?? 'desconocido'}`,
      );

      return response.access_token;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const details = this.getErrorDetails(error);
      this.logger.error(
        `Error obteniendo token de pagos: ${JSON.stringify(details)}`,
      );

      if (details.status && details.status >= 400 && details.status < 500) {
        throw new BadRequestException({
          message: 'El sistema de pagos rechazo la autenticacion',
          details,
        });
      }

      throw new InternalServerErrorException({
        message: 'No se pudo obtener el token de pagos',
        details,
      });
    }
  }

  async crearOrdenPago(data: {
    referenceId: string;
    amount: number;
    description: string;
    paymentMethod?: 'TARJETA' | 'TRANSFERENCIA' | 'BILLETERA';
  }): Promise<any> {
    try {
      if (
        data.paymentMethod &&
        !PagoService.PAYMENT_METHODS.includes(data.paymentMethod)
      ) {
        throw new BadRequestException('Metodo de pago invalido');
      }

      const token = await this.getTokenPago();

      this.logger.log(
        `[PAGOS][2/3] Creando orden referenceId=${data.referenceId}, amount=${data.amount}, method=${data.paymentMethod || PagoService.DEFAULT_PAYMENT_METHOD}`,
      );

      const response = await this.requestPagos<any>('/v1/payments/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referenceId: data.referenceId,
          originService: PagoService.ORIGIN_SERVICE,
          amount: data.amount,
          paymentMethod:
            data.paymentMethod || PagoService.DEFAULT_PAYMENT_METHOD,
          description: data.description,
        }),
      });

      this.logger.log(
        `[PAGOS][2/3] Orden creada: ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if ((error as any).status === 409) {
        this.logger.warn(
          `[PAGOS][2/3] Ya existe una orden para referenceId=${data.referenceId}. Se consultara el estado actual.`,
        );

        return {
          id: null,
          referenceId: data.referenceId,
          alreadyExists: true,
        };
      }

      const details = this.getErrorDetails(error);
      this.logger.error(
        `Error creando orden de pago: ${JSON.stringify(details)}`,
      );

      if (details.status && details.status >= 400 && details.status < 500) {
        throw new BadRequestException({
          message: 'El sistema de pagos rechazo la orden',
          details,
        });
      }

      throw new InternalServerErrorException({
        message: 'Error al crear la orden de pago',
        details,
      });
    }
  }

  async consultarEstado(referenceId: string): Promise<{
    status: EstadoPagoExterno;
    id: string;
    amount: string;
    updatedAt?: string;
  }> {
    try {
      const token = await this.getTokenPago();

      this.logger.log(`[PAGOS][3/3] Consultando estado ${referenceId}`);

      const response = await this.requestPagos<{
        status: EstadoPagoExterno;
        id: string;
        amount: string;
        updatedAt?: string;
      }>(`/v1/payments/${referenceId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.logger.log(
        `[PAGOS][3/3] Estado recibido ${referenceId}: ${JSON.stringify(response)}`,
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if ((error as any).status === 404) {
        throw new BadRequestException('No se encontro la orden de pago');
      }

      const details = this.getErrorDetails(error);
      this.logger.error(
        `Error consultando estado del pago: ${JSON.stringify(details)}`,
      );

      if (details.status && details.status >= 400 && details.status < 500) {
        throw new BadRequestException({
          message: 'El sistema de pagos rechazo la consulta',
          details,
        });
      }

      throw new InternalServerErrorException({
        message: 'Error al consultar el estado del pago',
        details,
      });
    }
  }

  async processPayment(data: {
    referenceId: string;
    amount: number;
    description: string;
  }): Promise<{
    success: boolean;
    orderId: string;
    status: EstadoPagoExterno;
    message: string;
  }> {
    this.logger.log(
      `[PAGOS] Iniciando flujo completo referenceId=${data.referenceId}, amount=${data.amount}`,
    );

    const order = await this.crearOrdenPago({
      referenceId: data.referenceId,
      amount: data.amount,
      description: data.description,
    });

    const status = await this.consultarEstado(data.referenceId);

    const isApproved = status.status === 'APPROVED';
    const isPending = status.status === 'PENDING';
    const orderId = order.id ?? status.id;

    this.logger.log(
      `[PAGOS] Flujo completo finalizado referenceId=${data.referenceId}, orderId=${orderId}, status=${status.status}, alreadyExists=${order.alreadyExists === true}`,
    );

    return {
      success: isApproved,
      orderId,
      status: status.status,
      message: isApproved
        ? 'Pago aprobado exitosamente'
        : isPending
          ? order.alreadyExists
            ? 'La orden de pago ya existe y sigue pendiente de confirmacion'
            : 'Pago pendiente de confirmacion'
          : `Pago ${status.status.toLowerCase()}`,
    };
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
