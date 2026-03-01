-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "gerencianetClientId" TEXT,
ADD COLUMN     "gerencianetClientSecret" TEXT,
ADD COLUMN     "mercadopagoAccessToken" TEXT,
ADD COLUMN     "mercadopagoPublicKey" TEXT,
ADD COLUMN     "minChargeCents" INTEGER,
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "pixProvider" TEXT;
