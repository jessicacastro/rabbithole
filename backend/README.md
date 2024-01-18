# flash file drop

Aplicação de upload & download de arquivos, provendo um link rápido para compartilhamento e mantendo-o em até 7 dias.

Stack utilizada nesse projeto: Node.JS, Fastify, Prisma, Cloudflare R2.

### Requisitos

#### Requisitos Funcionais (RFs):

- [ ] Deve ser possível realizar novos uploads;
- [ ] Deve ser possível visualizar os últimos 5 uploads realizados;

#### Regras de Negócio (RNs):

- [ ] Os uploads devem ser removidos automaticamente após 7 dias;
- [ ] Só deve ser possível visualizar os uploads não expirados;
- [ ] Só deve ser possível realizar upload de arquivos seguros;
- [ ] Só deve ser possível upload de arquivos até 1gb cada;

#### Requisitos Não Funcionais (RNFs):

- [ ] Utilização do Cloudflare R2 para upload de arquivos;
- [ ] O upload deve ser feito diretamente pelo front-end utilizando Presigned URLs (estratégia de upload);
- [ ] Os links para compartilhamento devem ser assinados, evitando acesso público;

### Detalhes importantes

#### Mime Types proibidos

Alguns arquivos não podem ser enviados pelo usuário como: `.exe`, `.dll`, `.bat`, `.cmd`, `.sh`, `.cgi`, `.jar`, `.app`.

```ts
const BANNED_MIME_TYPES = [
  ".exe", // (executáveis),
  ".dll", // (bibliotecas dinâmicas)
  ".bat", // (arquivos em lote)
  ".cmd", // (arquivos de comando)
  ".sh", // (scripts shell)
  ".cgi", // (scripts CGI)
  ".jar", // (arquivos Java)
  ".app", // (aplicativos macOS)
];
```

#### Trechos de código

##### Conexão com Cloudflare (AWS SDK)

```ts
import { S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: env.CLOUDFLARE_SECRET_KEY,
  },
});
```

##### Upload no Cloudflare

```ts
const signedUrl = await getSignedUrl(
  r2,
  new PutObjectCommand({
    Bucket: "bucket-name",
    Key: "file.mp4",
    ContentType: "video/mp4",
  }),
  { expiresIn: 600 }
);
```

```ts
await axios.put(uploadURL, file, {
  headers: {
    "Content-Type": file.type,
  },
});
```
