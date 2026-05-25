import { LegalPage } from "@/components/LegalPage";

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Yasal Uyarı"
      description="Dijital İz Avcısı, dijital risk sinyallerini anlaşılır hale getiren bir farkındalık ve analiz platformudur."
      sections={[
        {
          title: "Kesin hüküm vermez",
          body: "Platform çıktıları bir kişi, kurum, satıcı veya web sitesi hakkında kesin suçlama veya kesin güven beyanı oluşturmaz."
        },
        {
          title: "Risk dili",
          body: "Sonuçlarda risk sinyali, şüpheli örüntü, dikkat edilmesi önerilir gibi kontrollü ifadeler kullanılır."
        },
        {
          title: "Kullanıcı sorumluluğu",
          body: "Kullanıcıların önemli kararlar öncesinde resmi kaynakları, satıcı bilgilerini ve ilgili kurum açıklamalarını ayrıca kontrol etmesi önerilir."
        }
      ]}
    />
  );
}
