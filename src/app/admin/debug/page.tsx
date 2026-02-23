import { auth, currentUser } from '@clerk/nextjs/server';

export default async function AdminDebugPage() {
    const { userId } = await auth();
    const user = await currentUser();

    const envEmailRaw = process.env.ADMIN_USER_EMAIL;
    const envEmailTrimmed = envEmailRaw?.trim().toLowerCase();

    const userEmails = user?.emailAddresses?.map(e => e.emailAddress) || [];
    const isAuthorized = user?.emailAddresses?.some(e => e.emailAddress.toLowerCase() === envEmailTrimmed);

    return (
        <div className="p-10 font-mono text-sm bg-slate-900 text-green-400 min-h-screen">
            <h1 className="text-2xl text-white mb-6">Admin Auth Diagnostics</h1>

            <div className="space-y-4">
                <div>
                    <strong className="text-white">1. Auth Status:</strong>
                    <span className="ml-2">{userId ? 'LOGGED IN' : 'NO SESSION'}</span>
                </div>

                <div>
                    <strong className="text-white">2. Raw ENV Variable (ADMIN_USER_EMAIL):</strong>
                    <span className="ml-2 text-yellow-300">"{envEmailRaw}"</span>
                    <div className="text-slate-500 text-xs mt-1">(Length: {envEmailRaw?.length || 0})</div>
                </div>

                <div>
                    <strong className="text-white">3. Trimmed ENV Variable:</strong>
                    <span className="ml-2">"{envEmailTrimmed}"</span>
                    <div className="text-slate-500 text-xs mt-1">(Length: {envEmailTrimmed?.length || 0})</div>
                </div>

                <div className="border border-slate-700 p-4 mt-4">
                    <strong className="text-white block mb-2">4. User Emails (from Clerk JWT):</strong>
                    <pre className="text-blue-300">{JSON.stringify(userEmails, null, 2)}</pre>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700 text-lg">
                    <strong className="text-white">5. Final Authorization Result:</strong>
                    <span className={`ml-2 font-bold ${isAuthorized ? 'text-green-500' : 'text-red-500'}`}>
                        {isAuthorized ? 'GRANTED' : 'DENIED'}
                    </span>
                </div>
            </div>
        </div>
    );
}
