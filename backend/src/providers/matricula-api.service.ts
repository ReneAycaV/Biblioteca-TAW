import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

interface TokenResponse {
  token?: string;
  access_token?: string;
  accessToken?: string;
}

interface MatriculaEstadoResponse {
  activo?: boolean;
  active?: boolean;
  matriculaActiva?: boolean;
  isActive?: boolean;
  estado?: string;
  status?: string;
}

@Injectable()
export class MatriculaApiService {
  private token?: string;
  private tokenExpiresAt = 0;

  private readonly baseUrl = this.normalizeBaseUrl(
    process.env.MATRICULA_API_BASE_URL ??
      process.env.MATRICULA_SYSTEM_URL ??
      '',
  );

  private readonly publicKey = process.env.MATRICULA_PUBLIC_KEY;
  private readonly privateKey = process.env.MATRICULA_PRIVATE_KEY;
  private readonly authPath = process.env.MATRICULA_AUTH_PATH ?? '/auth/token';
  private readonly statusPath =
    process.env.MATRICULA_STATUS_PATH ?? '/matricula/estado';
  private readonly isEnabled = process.env.MATRICULA_API_ENABLED === 'true';

  async consultarEstadoAcademico(rut: string): Promise<boolean> {
    if (!this.isEnabled) {
      return this.simularEstadoAcademico(rut);
    }

    if (!this.baseUrl || !this.privateKey) {
      throw new ServiceUnavailableException(
        'La API de matriculas no esta configurada',
      );
    }

    const token = await this.getToken();
    const response = await this.post<MatriculaEstadoResponse>(
      this.statusPath,
      {
        rut,
      },
      token,
    );

    return this.parseEstadoMatricula(response);
  }

  private simularEstadoAcademico(_rut: string): boolean {
    return true;
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await this.post<TokenResponse>(this.authPath, {
      privateKey: this.privateKey,
      publicKey: this.publicKey,
    });

    const token =
      response.token ?? response.access_token ?? response.accessToken;

    if (!token) {
      throw new BadGatewayException(
        'La API de matriculas no retorno un token valido',
      );
    }

    this.token = token;
    this.tokenExpiresAt = Date.now() + 1000 * 60 * 10;
    return token;
  }

  private async post<T>(
    path: string,
    body: unknown,
    token?: string,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${this.normalizePath(path)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.publicKey ? { 'x-api-key': this.publicKey } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadGatewayException(
        `La API de matriculas respondio con estado ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }

  private parseEstadoMatricula(response: MatriculaEstadoResponse): boolean {
    const estado =
      response.estado?.toLowerCase() ?? response.status?.toLowerCase();

    if (typeof response.activo === 'boolean') return response.activo;
    if (typeof response.active === 'boolean') return response.active;
    if (typeof response.matriculaActiva === 'boolean') {
      return response.matriculaActiva;
    }
    if (typeof response.isActive === 'boolean') return response.isActive;
    if (estado)
      return ['activo', 'activa', 'vigente', 'regular'].includes(estado);

    throw new BadGatewayException(
      'La API de matriculas retorno un formato de estado desconocido',
    );
  }

  private normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  private normalizePath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
