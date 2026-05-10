"use client"
import React from "react"
import { useState } from "react"
import { JobsPageHeader } from "./JobsPageHeader"
import { JobIntakeCard } from "./JobIntakeCard"
import { PipelineSummaryTiles } from "./PipelineSummaryTiles"
import { PipelineFilters } from "./PipelineFilters"
import { JobPipelineBoard } from "./JobPipelineBoard"
import { JobIntelligencePanel } from "./JobIntelligencePanel"

  const [selectedFilter, setSelectedFilter] = useState("all")
  const [jobList, setJobList] = useState(jobs)
  const filteredJobs = selectedFilter === "all"
    ? jobList
    : jobList.filter((job) => job.status === selectedFilter)

  async function handleIntake(url: string) {
    // Optimistically add a draft job
    const newJob = {
      id: `draft-${Date.now()}`,
      role_title: "(Analyzing)",
      company_name: "—",
      status: "queued",
      generated_resume: null,
      created_at: new Date().toISOString(),
    }
    setJobList([newJob, ...jobList])
    // Call API route to analyze job
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error("Failed to analyze job")
      // Optionally, refresh jobs from server
      window.location.reload()
    } catch (err) {
      // Remove optimistic job if error
      setJobList(jobList)
      alert("Failed to analyze job. Please try again.")
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-9 2xl:col-span-10">
        <JobsPageHeader />
        <JobIntakeCard onSubmit={handleIntake} />
        <PipelineSummaryTiles jobs={jobList} />
        <PipelineFilters selected={selectedFilter} onSelect={setSelectedFilter} />
        <JobPipelineBoard jobs={filteredJobs} />
      </div>
      <JobIntelligencePanel jobs={jobList} />
    </div>
  )
}