import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl text-gray-800 bg-white md:bg-transparent">
      <div className="bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold mb-8 border-b pb-4 border-gray-200">プライバシーポリシー</h1>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">1. 個人情報の利用目的</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイト（Free Images）では、メールでのお問い合わせやサービス利用時に、お名前（ハンドルネーム）、メールアドレス等の個人情報をご登録いただく場合がございます。
            これらの個人情報は、質問に対する回答や必要な情報を電子メールなどでご連絡する場合に利用させていただくものであり、個人情報をご提供いただく際の目的以外では利用いたしません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">2. 個人情報の第三者への開示</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトでは、個人情報は適切に管理し、以下に該当する場合を除いて第三者に開示することはありません。
          </p>
          <ul className="list-disc ml-6 mb-4 text-gray-600">
            <li>本人のご了解がある場合</li>
            <li>法令等への協力のため、開示が必要となる場合</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">3. 広告の配信について</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトでは、第三者配信の広告サービス（Googleアドセンスなど）を利用する予定です。<br />
            このような広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」（氏名、住所、メールアドレス、電話番号は含まれません）を使用することがあります。
          </p>
          <p className="mb-4 text-gray-600 leading-relaxed">
            またGoogleアドセンスに関して、このプロセスの詳細や、このような情報が広告配信事業者に使用されないようにする方法については、
            <a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Googleのポリシーと規約
            </a>
            をご確認ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">4. アクセス解析ツールについて</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。<br />
            このGoogleアナリティクスはトラフィックデータの収集のためにCookieを使用しています。このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
            この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">5. 免責事項</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。<br />
            当サイトのコンテンツ・情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、誤情報が入り込んだり、情報が古くなっていることもございます。<br />
            当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900">6. 著作権について</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトに掲載されている文章・画像（AI生成画像を除く）・動画等の著作権は当サイト管理者に帰属します。<br />
            法的に認められている引用の範囲を超えて、無断で転載することを禁止します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900">7. お問い合わせ</h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            当サイトの個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。
          </p>
          <p className="text-gray-600">
            運営者： indigo<br />
            お問い合わせ： 
            <a href="https://forms.gle/feuypDPrskygUFFT6" className="text-blue-600 hover:underline">
              お問い合わせフォームはこちら
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}