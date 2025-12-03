import { Html, Head, Main, NextScript } from "next/document";
import { CronJob } from 'cron';
export default function Document() {
  // const job = new CronJob(
  //   '*/10 * * * * *', // cronTime - setiap 10 detik
  //   function () {
  //     console.log('You will see this message every 10 seconds');
  //   }, // onTick
  //   null, // onComplete
  //   true, // start
  //   'system' // timeZone
  // );

  // job.start();
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
