import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      description="Dijital İz Avcısı, kullanıcı güvenini merkeze alan sade ve şeffaf bir veri yaklaşımı hedefler."
      sections={[
        {
          title: "Veri minimizasyonu",
          body: "Platformun amacı gereği yalnızca analiz için gerekli bilgiler işlenir. Ödeme bilgisi alınmaz ve gereksiz kişisel veri toplanması hedeflenmez."
        },
        {
          title: "Analiz kayıtları",
          body: "Analiz geçmişi özelliği etkinleştirildiğinde sorgu sonuçları kullanıcıya kolaylık sağlamak için saklanabilir. Bu alan şu anda mock veya planlı veriyle çalışabilir."
        },
        {
          title: "Üçüncü taraf servisler",
          body: "OpenAI, parser servisleri veya güvenlik API entegrasyonları devreye alındığında ilgili veri aktarımı ayrıca yapılandırılmalı ve dokümante edilmelidir."
        }
      ]}
    />
  );
}
