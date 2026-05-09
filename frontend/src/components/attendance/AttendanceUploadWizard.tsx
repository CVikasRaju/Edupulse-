"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface AttendanceUploadWizardProps {
  role: "admin" | "mentor" | "student";
}

const AttendanceUploadWizard: React.FC<AttendanceUploadWizardProps> = ({ role }) => {
  const router = useRouter();
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder: implement actual upload logic later
    console.log(`Upload triggered for ${role}`);
    // After successful upload, redirect to appropriate dashboard
    if (role === "admin") router.push("/admin/attendance");
    else if (role === "mentor") router.push("/mentor/attendance");
    else router.push("/student/attendance");
  };

  return (
    <div className="card p-6 max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Attendance Upload ({role})</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Select Excel/CSV file</label>
          <input type="file" accept=".xlsx,.xls,.csv" required className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Upload
        </button>
      </form>
    </div>
  );
};

export default AttendanceUploadWizard;
