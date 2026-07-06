import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function PapikostikSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-4 shadow-sm border border-slate-100 sm:rounded-3xl sm:px-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            Assessment Completed
          </h2>
          <p className="mt-4 text-slate-500 leading-relaxed">
            Thank you for completing the PAPI Kostick assessment. Your responses have been successfully recorded. 
          </p>
          <p className="mt-2 text-slate-500 leading-relaxed">
            You may now close this page. Our team will review your results and get back to you shortly.
          </p>
          <div className="mt-10">
            <Link 
              href="/" 
              className="inline-flex w-full justify-center items-center px-6 py-3 border border-slate-200 text-base font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
