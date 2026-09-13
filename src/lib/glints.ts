// Integrasi pencarian loker Glints (endpoint publik, tanpa API key).
// Endpoint ini undocumented tapi dipakai langsung oleh frontend glints.com sendiri
// untuk fitur explore/search loker.

const GLINTS_ENDPOINT = 'https://glints.com/api/v2-alc/graphql?op=searchJobsV3';

const SEARCH_QUERY = `query searchJobsV3($data: JobSearchConditionInput!) {
  searchJobsV3(data: $data) {
    jobsInPage {
      id
      title
      type
      status
      company { name __typename }
      location { name __typename }
      hierarchicalJobCategory { name __typename }
      salaries { minAmount maxAmount salaryType salaryMode CurrencyCode __typename }
      __typename
    }
    hasMore
    __typename
  }
}`;

interface GlintsSalary {
  minAmount: number | null;
  maxAmount: number | null;
  salaryType: string;
}

interface GlintsJobRaw {
  title: string;
  type: string | null;
  status: string;
  company: { name: string | null } | null;
  location: { name: string | null } | null;
  hierarchicalJobCategory: { name: string | null } | null;
  salaries: GlintsSalary[] | null;
}

export interface GlintsJobResult {
  title: string;
  jobFunction: string | null;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

/**
 * Ambil daftar loker aktif (status OPEN) dari Glints untuk perusahaan
 * yang namanya cocok persis (case-insensitive) dengan `companyKeyword`.
 */
export async function fetchGlintsJobsByCompany(companyKeyword: string): Promise<GlintsJobResult[]> {
  const res = await fetch(GLINTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'searchJobsV3',
      variables: {
        data: {
          SearchTerm: companyKeyword,
          CountryCode: 'ID',
          includeExternalJobs: true,
          pageSize: 30,
          page: 1,
        },
      },
      query: SEARCH_QUERY,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Glints API merespons status ${res.status}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || 'Glints API mengembalikan error');
  }

  const jobs: GlintsJobRaw[] = json.data?.searchJobsV3?.jobsInPage ?? [];
  const keyword = companyKeyword.trim().toLowerCase();

  return jobs
    .filter((job) => job.status === 'OPEN' && job.company?.name?.trim().toLowerCase() === keyword)
    .map((job) => {
      const basicSalary =
        job.salaries?.find((s) => s.salaryType === 'BASIC') ?? job.salaries?.[0] ?? null;

      return {
        title: job.title,
        jobFunction: job.hierarchicalJobCategory?.name ?? null,
        jobType: job.type ?? null,
        location: job.location?.name ?? null,
        salaryMin: basicSalary?.minAmount ?? null,
        salaryMax: basicSalary?.maxAmount ?? null,
      };
    });
}
