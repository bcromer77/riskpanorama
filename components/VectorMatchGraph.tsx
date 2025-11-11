"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { motion } from "framer-motion";

interface Node {
  id: string;
  label: string;
  group: string;
  score: number;
}

interface Link {
  source: string;
  target: string;
  weight: number;
}

export default function VectorMatchGraph({
  nodes,
  links,
  onSelect,
}: {
  nodes: Node[];
  links: Link[];
  onSelect?: (label: string) => void;
}) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 420;

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.weight * 6));

    const node = svg
      .append("g")
      .attr("stroke", "#FFF")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => 10 + d.score * 10)
      .attr("fill", (d) =>
        d.group === "Regulation"
          ? "#10B981"
          : d.group === "Supplier"
          ? "#3B82F6"
          : d.group === "Signal"
          ? "#F59E0B"
          : "#64748B"
      )
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        if (onSelect) onSelect(d.label);
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const labels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", 3)
      .attr("font-size", "10px")
      .attr("fill", "#334155")
      .text((d) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y - 18);
    });
  }, [nodes, links, onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border rounded-2xl shadow-sm p-4"
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
        Vector Match Graph
      </h3>
      <svg ref={ref} width="100%" height="420"></svg>
    </motion.div>
  );
}

