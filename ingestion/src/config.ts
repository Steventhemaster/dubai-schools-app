import 'dotenv/config';

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  dubaiPulse: {
    apiKey: process.env.DUBAI_PULSE_API_KEY ?? '',
    apiSecret: process.env.DUBAI_PULSE_API_SECRET ?? '',
    resourceId: process.env.DUBAI_PULSE_RESOURCE_ID ?? 'khda_dubai_private_schools',
    tokenUrl:
      'https://api.dubaipulse.gov.ae/oauth/client_credential/accesstoken?grant_type=client_credentials',
    baseUrl: 'https://api.dubaipulse.gov.ae',
  },
  csv: {
    path: process.env.CSV_PATH ?? './sample/khda_sample.csv',
  },
  khda: {
    // Official KHDA "Dubai's Private Schools Open Data" workbook.
    // Download: https://web.khda.gov.ae/KHDA/media/KHDA/DubaiPrivateSchoolsOpenData.xlsx
    xlsxPath:
      process.env.KHDA_XLSX_PATH ?? './downloads/DubaiPrivateSchoolsOpenData.xlsx',
  },
  requireSupabase(): void {
    req('SUPABASE_URL');
    req('SUPABASE_SERVICE_ROLE_KEY');
    // A service-role key behind an EXPO_PUBLIC_ prefix would ship inside the
    // app bundle — fail fast if someone wires it up that way by mistake.
    if (process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Service role key must NEVER use the EXPO_PUBLIC_ prefix (it would ship in the app bundle).'
      );
    }
  },
};

export const hasSupabase = () =>
  !!config.supabase.url && !!config.supabase.serviceRoleKey;
