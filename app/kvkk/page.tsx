import { LegalPage } from "@/components/LegalPage";

export default function KvkkPage() {
  return (
    <LegalPage
      title="KVKK Bilgilendirme"
      description="Bu sayfa, Dijital İz Avcısı platformunda işlenen veriler hakkında genel bilgilendirme amacıyla hazırlanmıştır."
      sections={[
        {
          title: "İşlenen veri kapsamı",
          body: "Platform, analiz işlemleri sırasında kullanıcı tarafından girilen link, mesaj metni veya benzeri içerikleri değerlendirebilir. Gerçek üyelik altyapısı devreye alındığında hesap bilgileri ayrıca açık şekilde belirtilecektir."
        },
        {
          title: "Kullanım amacı",
          body: "Veriler; risk sinyali üretmek, analiz geçmişi göstermek, kullanıcı bildirimlerini incelemek ve platform güvenliğini geliştirmek amacıyla kullanılabilir."
        },
        {
          title: "Bilgilendirme niteliği",
          body: "Sunulan analizler kesin hüküm değildir. Sonuçlar teknik sinyaller ve örüntü değerlendirmeleri temelinde bilgilendirme amacı taşır."
        }
      ]}
    />
  );
}
