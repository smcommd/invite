import { Html, Head, Main, NextScript } from "next/document";

const Document = () => {
  return (
    <Html lang="ko">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(d){var config={kitId:'tfe6ntw',scriptTimeout:3000,async:true},h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,'')+' wf-inactive';},config.scriptTimeout),tk=d.createElement('script'),f=false,s=d.getElementsByTagName('script')[0],a;h.className+=' wf-loading';tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!='complete'&&a!='loaded')return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)})(document);",
          }}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SMUCD 2025 Invitation" />
        <meta property="og:title" content="SMUCD 2025 Invitation" />
        <meta property="og:description" content="상명대학교 디자인대학 커뮤니케이션디자인전공 제38회 졸업전시 초대장을 만들어 보세요." />
        <meta property="og:url" content="https://hyeoksu1234.github.io/invite_2/" />
        <meta property="og:image" content="https://hyeoksu1234.github.io/invite_2/thum.png" />
        <meta property="og:image:width" content="2832" />
        <meta property="og:image:height" content="1368" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SMUCD 2025 Invitation" />
        <meta name="twitter:description" content="상명대학교 디자인대학 커뮤니케이션디자인전공 제38회 졸업전시 초대장을 만들어 보세요." />
        <meta name="twitter:image" content="https://hyeoksu1234.github.io/invite_2/thum.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
