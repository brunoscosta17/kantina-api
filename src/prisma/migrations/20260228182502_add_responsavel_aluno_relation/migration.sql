-- CreateTable
CREATE TABLE "StudentOnResponsavel" (
    "responsavelId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "StudentOnResponsavel_pkey" PRIMARY KEY ("responsavelId","studentId")
);

-- AddForeignKey
ALTER TABLE "StudentOnResponsavel" ADD CONSTRAINT "StudentOnResponsavel_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOnResponsavel" ADD CONSTRAINT "StudentOnResponsavel_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
