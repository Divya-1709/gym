async function getPDFModules() {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  return { jsPDF, autoTable };
}

import logo from "../assets/logo.jpeg";

export const generateCurrentPackageBillDoc = async (client: any) => {
  const { jsPDF, autoTable } = await getPDFModules();
  const doc = new jsPDF("p", "mm", "a4");

  const today = new Date().toLocaleDateString("en-GB");
  const invoiceNo = `${client.memberId}`;

  /* ================= HEADER ================= */
  doc.addImage(logo, "PNG", 14, 10, 30, 30);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Elite Fitness", 50, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    [
      "Address: Nagajothi Campus, Ilayarasanendal Road, (Opposite EB office),",
      "Nadarajapuram, Kovilpatti, Tamilnadu - 628502",
      "Phone: +91 87782 85877",
      "Email: elitefitnesskvp@gmail.com",
    ],
    50,
    24
  );

  doc.setFontSize(10);
  doc.text(`Invoice number: ${invoiceNo}`, 14, 48);

  /* ================= CLIENT DETAIL ================= */
  autoTable(doc, {
    startY: 52,
    theme: "plain",
    styles: { fontSize: 9 },
    body: [
      [
        {
          content: "Client Detail",
          colSpan: 2,
          styles: { fillColor: [150, 150, 150], textColor: 255 },
        },
      ],
      ["Member ID", client.memberId],
      ["Name", client.client],
      ["Phone", client.contactNumber],
      ["Billing Date", today],
    ],
  });

  /* ================= DESCRIPTION ================= */
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: "plain",
    styles: { fontSize: 9 },
    body: [
      [
        {
          content: "Description",
          colSpan: 2,
          styles: { fillColor: [150, 150, 150], textColor: 255 },
        },
      ],
      ["Package", client.package],
      ["Start Date", client.joiningDate],
      ["End Date", client.endDate],
      ["Billed By", "Admin"],
    ],
  });

  /* ================= BILLING ================= */
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 3,
    theme: "plain",
    styles: { fontSize: 9 },
    body: [
      [
        {
          content: "Billing Detail",
          colSpan: 2,
          styles: { fillColor: [150, 150, 150], textColor: 255 },
        },
      ],
      ["Package Fees", `Rs. ${client.price || 0}`],
      ["Discount", `Rs. ${client.discountAmount || 0}`],
      ["Tax", `Rs. ${client.tax || 0}`],
      ["Paid Amount", `Rs. ${client.amountPaid || 0}`],
      [
        { content: "Pending Amount", styles: { fontStyle: "bold" } },
        { content: `Rs. ${client.balance || 0}`, styles: { fontStyle: "bold" } },
      ],
    ],
  });

  /* ================= TERMS ================= */
  doc.setFontSize(8);
  doc.setTextColor(255, 0, 0);
  doc.text(
    [
      "Terms & Conditions:",
      "1. Membership is personal.",
      "2. No adjustment for missed days.",
      "3. Gym not responsible for personal loss.",
      "4. Management reserves the right to suspend membership.",
    ],
    14,
    (doc as any).lastAutoTable.finalY + 12
  );

  /* ================= FOOTER ================= */
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(
    "To accept this invoice, sign here and return ____________________",
    14,
    270
  );
  doc.text(
    "Thank you for your business and we look forward to coaching you.",
    14,
    278
  );
  doc.text("Elite Fitness Kovilpatti", 90, 288);

  return doc;
};

export const generateCurrentPackageBill = async (client: any) => {
  const doc = await generateCurrentPackageBillDoc(client);
  doc.save(`Bill_${client.client || "Client"}_${client.memberId || "Invoice"}.pdf`);
};

export const getInvoicePDFFile = async (client: any): Promise<File> => {
  const doc = await generateCurrentPackageBillDoc(client);
  const blob = doc.output("blob");
  const filename = `Bill_${client.client || "Client"}_${client.memberId || "Invoice"}.pdf`;
  return new File([blob], filename, { type: "application/pdf" });
};
