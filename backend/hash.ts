import * as bcryptjs from 'bcryptjs';

async function main() {
  const hash = await bcryptjs.hash('123456', 10);
  console.log(hash);
}

main();
