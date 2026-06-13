import Link from "next/link";
import { ClientForm } from "../_form";
import { createClient } from "../actions";

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/clients" className="text-sm text-neutral-500 hover:underline">
          ← Back to clients
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          New client
        </h1>
      </div>
      <ClientForm action={createClient} submitLabel="Create client" />
    </div>
  );
}
