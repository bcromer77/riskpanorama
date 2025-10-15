"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe2, AlertTriangle, Brain, TrendingUp, Search, Play, Zap, Shield, DollarSign, Truck, Users, BarChart3, Upload, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as ReBarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import CityIntelCard from "@/components/bapa/CityIntelCard";
import { trendingSignals } from "@/lib/mockData";

type Report = {
  success: boolean;
  city: string;
  summary: {
    risks: Array<any>;
    deliveries: Array<any>;
    fleet: Array<any>;
    context_docs: Array<any>;
    guidance: string[];
  };
};

// Sample dynamic data - fallback for non-API scenarios
const initialRiskTrends = [
  { name: "Barcelona", risk: 84, change: +12 },
  { name: "Madrid", risk: 67, change: -5 },
  { name: "Paris", risk: 52, change: +3 },
  { name: "Dublin", risk: 49, change: -2 },
];

const alerts = [
  { id: 1, title: "Barcelona Port Congestion", risk: 0.84, category: "Supply Chain", severity: "High", pulse: "green", narrative: "CBAM tariffs delay EV shipments—rethink Tier-1 dependencies." },
  { id: 2, title: "Madrid Water Rights Dispute", risk: 0.79, category: "ESG", severity: "High", pulse: "amber", narrative: "Drought erodes scores—anticipate 12% drop in compliance." },
  { id: 3, title: "Paris Retail Data Failure", risk: 0.72, category: "Operational", severity: "Medium", pulse: "blue", narrative: "GDPR cascade—resilience test incoming." },
];

const agents = [
  { name: "Scout", status: "Scanning", tasks: "1,200+ global feeds", icon: "🛰️", color: "#10b981" },
  { name: "Interpreter", status: "Parsing", tasks: "ESG & regulatory docs", icon: "🧠", color: "#3b82f6" },
  { name: "Connector", status: "Linking", tasks: "Exposure chains", icon: "⚙️", color: "#f59e0b" },
  { name: "Narrator", status: "Storytelling", tasks: "Clear signals", icon: "📊", color: "#8b5cf6" },
  { name: "Watchtower", status: "Guarding", tasks: "Guardrails active", icon: "🛡️", color: "#ef4444" },
];

const portfolioExposures = [
  { entity: "EV Battery Co.", exposure: 25, risk: 78, type: "Investor", color: "#ef4444" },
  { entity: "Nordic Grocer", exposure: 15, risk: 62, type: "Supply Chain", color: "#10b981" },
  { entity: "Meat Processor", exposure: 10, risk: 55, type: "Underwriter", color: "#3b82f6" },
];

const pieData = [{ name: "Supply Chain", value: 45 }, { name: "ESG", value: 30 }, { name: "Operational", value: 25 }];
const COLORS = ["#ef4444", "#10b981", "#3b82f6"];

const scenarioSimulations = [
  { action: "Reroute via Gdansk", savings: 72, cost: 4, confidence: 85, rationale: "Mental model: Inversion—avoids spoilage cascade." },
  { action: "Supplier Substitution", savings: 55, cost: 8, confidence: 92, rationale: "Latticework: Supply diversity as antifragile buffer." },
  { action: "Hedging Contracts", savings: 40, cost: 12, confidence: 78, rationale: "Value investing: Hedge tail risks without overpaying." },
];

export default function TimelessRiskPanorama() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Barcelona");
  const [viewMode, setViewMode] = useState("investor"); // investor, supplychain, underwriter
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [simulatedAction, setSimulatedAction] = useState(null);
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const [report, setReport] = useState<Report | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const filteredTrends = initialRiskTrends.filter(trend => 
    trend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Rosling-inspired animation for trends
  const x = useMotionValue(0);
  const rotateX = useSpring(useTransform(x, [0, 100], [0, 360]), { stiffness: 100, damping: 10 });

  const handlePulseClick = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  const runSimulation = (action) => {
    setSimulatedAction(action);
    // In real app, trigger API for simulation
  };

  async function uploadPdf() {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("tags", JSON.stringify({ city: selectedCountry }));
      const res = await fetch("/api/bapa/ingest", { method: "POST", body: form });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || "Upload failed");
      alert("PDF ingested. It will immediately enrich city context.");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function generateCity() {
    setGenerating(true);
    try {
      const res = await fetch("/api/bapa/city/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: selectedCountry })
      });
      const j = (await res.json()) as Report;
      if (!j.success) throw new Error("Failed to build city report");
      setReport(j);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  }

  const getViewSpecificContent = () => {
    switch (viewMode) {
      case "investor":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 bg-gradient-to-br from-slate-50 to-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800"><DollarSign className="h-5 w-5" opacity={0.8} /> Portfolio Latticework</CardTitle>
                <p className="text-sm text-slate-600">See risks through multidisciplinary lenses—click bubbles for Munger-style inversion.</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis type="category" dataKey="entity" name="Entities" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis type="number" dataKey="risk" name="Risk Score" unit="" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <ZAxis type="number" dataKey="exposure" name="Exposure" unit="%" range={[20, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: "14px", borderRadius: "8px" }} />
                    <Scatter name="Exposure" data={portfolioExposures} fill="#cbd5e1">
                      {portfolioExposures.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          onMouseEnter={() => setHoveredBubble(entry.entity)}
                          onMouseLeave={() => setHoveredBubble(null)}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "supplychain":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-light flex items-center gap-2 text-emerald-800"><Truck className="h-5 w-5" opacity={0.8} /> Chain of Thought</CardTitle>
                <p className="text-sm text-slate-600">Forecast disruptions with clear stories—simulate to lean in.</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ReBarChart data={initialRiskTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [value, 'Disruption Score']} contentStyle={{ fontSize: "14px" }} />
                    <Bar dataKey="risk" fill="#10b981" name="Disruption Risk" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-3">
                  {scenarioSimulations.map((sim, idx) => (
                    <motion.div
                      key={idx}
                      className="flex justify-between items-start p-3 bg-white rounded-lg shadow-sm border border-slate-200"
                      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{sim.action}</p>
                        <p className="text-xs text-slate-600 mt-1 italic">"{sim.rationale}"</p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">+{sim.savings}% Savings</Badge>
                        <Button size="sm" variant="ghost" onClick={() => runSimulation(sim)} className="mt-1 text-emerald-700 hover:bg-emerald-50">
                          <Play size={12} className="mr-1" /> Act
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      case "underwriter":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-0 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-light flex items-center gap-2 text-indigo-800"><Shield className="h-5 w-5" opacity={0.8} /> Premium Clarity</CardTitle>
                <p className="text-sm text-slate-600">Distribute risks vividly—stress test with precision.</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      fill="#cbd5e1" 
                      dataKey="value" 
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      strokeWidth={2}
                      stroke="#f1f5f9"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "14px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => runSimulation(scenarioSimulations[0])} className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                    <Zap size={12} className="mr-1" /> Invert Risks
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <BarChart3 size={12} className="mr-1" /> Export Lattice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans antialiased">
      {/* Serene Header: Jobs/Ive simplicity meets Norman discoverability */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-12 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-6">
          <h1 className="text-5xl font-light tracking-wide text-slate-800 leading-tight">
            RiskPanorama
          </h1>
          <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-slate-300 px-4 py-1 text-sm font-medium">Live Mesh</Badge>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex gap-3">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-48 border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <SelectValue placeholder="Lens" />
              </SelectTrigger>
              <SelectContent className="border-slate-300 bg-white">
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="supplychain">Supply Chain</SelectItem>
                <SelectItem value="underwriter">Underwriter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 relative">
            <Input 
              placeholder="Seek clarity..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-white border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-96" 
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              Scan
            </Button>
          </div>
        </div>
      </motion.header>

      {/* PDF Upload Card - Integrated from second code */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800">
              <Upload className="h-5 w-5" opacity={0.8} /> Ingest Documents
            </CardTitle>
            <p className="text-sm text-slate-600">Upload ESG/policy PDFs to enrich {selectedCountry} context via vector search.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-center">
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="flex-1" />
              <Button disabled={!file || uploading} onClick={uploadPdf} className="bg-emerald-600 hover:bg-emerald-700">
                {uploading ? "Ingesting…" : "Ingest File"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        {/* Global Mesh: Rosling vividness, Land color science */}
        <Card className="lg:col-span-2 border-0 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50/30 pb-4">
            <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800"><Globe2 className="h-5 w-5" opacity={0.8} /> World in Motion</CardTitle>
            <p className="text-sm text-slate-600">Pulses tell stories—green for emergence, amber for escalation. Click to uncover.</p>
          </CardHeader>
          <CardContent className="p-0 relative">
            <div 
              className="relative h-80 bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center"
              style={{ perspective: '1000px' }}
            >
              {/* Pulsing Bubbles: Ive precision, Norman affordance */}
              <AnimatePresence>
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    className="absolute rounded-full shadow-lg cursor-pointer border-2 border-white/50"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 50}%`,
                      width: 16,
                      height: 16,
                      backgroundColor: alert.pulse === 'green' ? '#10b981' : alert.pulse === 'amber' ? '#f59e0b' : '#3b82f6',
                    }}
                    initial={{ scale: 0, opacity: 0, rotateX: 0 }}
                    animate={{ 
                      scale: [1, 1.8, 1], 
                      opacity: [0.6, 1, 0.6],
                      rotateX: rotateX,
                      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                    whileHover={{ scale: 2, zIndex: 10, transition: { duration: 0.2 } }}
                    onClick={() => handlePulseClick(alert)}
                    onHoverStart={() => x.set(100)}
                    onHoverEnd={() => x.set(0)}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="text-center z-10 px-4">
                <Globe2 className="h-12 w-12 text-slate-400 mx-auto mb-4 opacity-70" />
                <p className="text-slate-600 font-light text-sm leading-relaxed">The world turns; risks emerge. Watch, learn, act.</p>
                <p className="text-xs text-indigo-600 mt-2 font-medium opacity-80">{alerts.length} signals today</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">Provenance: 47 sources, clustered for truth.</p>
            </div>
          </CardContent>
        </Card>

        {/* Signals & Flows: Sandberg empowerment, Schneider minimalism */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50/30 pb-4">
              <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800"><AlertTriangle className="h-5 w-5 text-rose-500" /> Emerging Signals</CardTitle>
              <p className="text-sm text-slate-600">Prioritized for you—click for the full story.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence mode="wait">
                {alerts.filter(alert => alert.title.toLowerCase().includes(searchQuery.toLowerCase())).map((alert, idx) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20, y: 20 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, x: 20, y: -20 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all duration-300"
                    onClick={() => handlePulseClick(alert)}
                  >
                    <motion.div
                      className="flex-shrink-0 mt-1"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        backgroundColor: alert.pulse === 'green' ? '#10b981' : alert.pulse === 'amber' ? '#f59e0b' : '#3b82f6'
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 rounded-full" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm leading-tight group-hover:text-indigo-700">{alert.title}</p>
                      <p className="text-xs text-slate-600 mt-1 italic">{alert.narrative}</p>
                      <p className="text-xs text-slate-500 mt-2">{alert.category} • {alert.severity}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto self-start border-slate-300 text-slate-700">{alert.risk}</Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50/30 pb-4">
              <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800"><TrendingUp className="h-5 w-5 text-emerald-600" /> Risk Flow</CardTitle>
              <p className="text-sm text-slate-600">Trends that inform, not overwhelm.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={filteredTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e2e8f0", 
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="risk" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 8, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Agent Harmony: Schneier trust, Norman feedback */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50/30 pb-4">
              <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800"><Brain className="h-5 w-5 text-violet-600" /> Quiet Guardians</CardTitle>
              <p className="text-sm text-slate-600">Agents at work—transparent, auditable.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {agents.map((agent, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-violet-300 transition-colors"
                >
                  <div className="text-lg" style={{ color: agent.color }}>{agent.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{agent.name}</p>
                    <p className="text-xs text-slate-600">{agent.tasks}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-slate-300 bg-white">{agent.status}</Badge>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Lens: Dynamic, story-driven */}
      <AnimatePresence mode="wait">
        {getViewSpecificContent()}
      </AnimatePresence>

      {/* City Intelligence Generate Button - Integrated */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-light flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5" opacity={0.8} /> {selectedCountry} Intelligence
            </CardTitle>
            <p className="text-sm text-slate-600">Generate enriched report from ingested docs and global signals.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 items-center">
              <Select value={selectedCountry} onValueChange={(v) => setSelectedCountry(v)}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Barcelona">Barcelona</SelectItem>
                  <SelectItem value="Madrid">Madrid</SelectItem>
                  <SelectItem value="Paris">Paris</SelectItem>
                  <SelectItem value="Dublin">Dublin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={generateCity} className="bg-emerald-600 hover:bg-emerald-700">
                {generating ? "Generating…" : `Generate ${selectedCountry} Report`}
              </Button>
            </div>
            {report?.success && (
              <CityIntelCard
                city={report.city}
                risks={report.summary.risks}
                deliveries={report.summary.deliveries}
                fleet={report.summary.fleet}
                docs={report.summary.context_docs}
                guidance={report.summary.guidance}
                onExport={() => window.print()}
              />
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Panorama Base: Munger clarity, Sandberg call-to-action */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-light text-slate-800 mb-6 flex items-center gap-3 leading-tight">
          {selectedCountry} • A Clear View
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 bg-gradient-to-br from-rose-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light text-rose-700 flex items-center gap-2"><Truck className="h-4 w-4" /> Supply Chain</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-2 text-sm">
              <p>Balama echoes: Graphite flows interrupted. Invert: What if diversified?</p>
              <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 w-full justify-start">
                <Play size={12} className="mr-2" /> Explore Paths
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light text-indigo-700 flex items-center gap-2"><Shield className="h-4 w-4" /> ESG Horizon</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-2 text-sm">
              <p>Sonora's drought: Rights in flux. Project: -12% score. Seek root causes.</p>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-50 w-full justify-start">
                Trace Sources
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-light text-emerald-700 flex items-center gap-2"><Users className="h-4 w-4" /> Social Fabric</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700 space-y-2 text-sm">
              <p>Strikes before polls: Volatility at 0.77. Lattice: Psychology + politics.</p>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 w-full justify-start">
                Build Case
              </Button>
            </CardContent>
          </Card>
        </div>
        {simulatedAction && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <p className="text-emerald-800 font-light text-sm italic">Insight: {simulatedAction.rationale} • Outcome: +{simulatedAction.savings}% resilience, {simulatedAction.confidence}% sure.</p>
          </motion.div>
        )}
      </motion.section>

      {/* Dialogue: Ive seamlessness */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-light text-xl text-slate-800">{selectedAlert?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">{selectedAlert?.risk}</Badge>
              <Badge className="bg-indigo-100 text-indigo-700">{selectedAlert?.category}</Badge>
            </div>
            <p className="text-slate-700 font-light text-sm leading-relaxed">{selectedAlert?.narrative}</p>
            <p className="text-xs text-slate-500">Provenance: 12 signals, fully cited. No black boxes.</p>
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowModal(false)} className="bg-slate-50 text-slate-700 hover:bg-slate-100">Reflect</Button>
              <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">View Graph</Button>
              <Button variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Notify Team</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
