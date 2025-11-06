-- AlterTable
ALTER TABLE "Dog" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "ClientNote" ADD COLUMN     "dogId" TEXT;

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
