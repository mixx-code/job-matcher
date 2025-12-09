import { Html, Head, Main, NextScript } from "next/document";
import { CronJob } from 'cron';
import { supabase } from "@/lib/supabaseClient";
export default function Document() {
  const getAllAlerts = async () => {
    const { data: alertsData, error } = await supabase
      .from('alerts')
      .select('*')

    console.log(alertsData)
    if (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  };
  // const job = new CronJob(
  //   '*/10 * * * * *', // setiap 10 detik
  //   async function () {
  //     await getAllAlerts();
  //   },
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
