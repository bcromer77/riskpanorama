"use client";

import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

interface Node {
  id: string;
  name: string;
  group: string;
}

interface Link {
  source: string;
  target: string;
}

interface Props {
  nodes: Node[];
  links: Link[];
}

export default function NetworkGraph({ nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState({ nodes, links });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // reset

    const width = svgRef.current.clientWidth;
    const height = 400;

    const color = d3
      .scaleOrdinal()
      .domain(["researcher", "county", "funding"])
      .range(["#ec4899", "#3b82f6", "#10b981"]);

    // Simulation setup
    const simulation = d3
      .forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#ddd")
      .attr("stroke-width", 1.5)
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line");

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => color(d.group) as string)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("click", async (_, d) => {
        const res = await fetch(`/api/network/${d.id}`);
        const extra = await res.json();
        if (extra.nodes.length === 0) return;

        // merge and deduplicate
        const mergedNodes = [
          ...data.nodes,
          ...extra.nodes.filter(
            (n: Node) => !data.nodes.some((m) => m.id === n.id)
          ),
        ];
        const mergedLinks = [
          ...data.links,
          ...extra.links.filter(
            (l: Link) =>
              !data.links.some(
                (m) => m.source === l.source && m.target === l.target
              )
          ),
        ];
        setData({ nodes: mergedNodes, links: mergedLinks });
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
      .data(data.nodes)
      .enter()
      .append("text")
      .text((d) => d.name)
      .attr("font-size", 10)
      .attr("dx", 12)
      .attr("dy", 4)
      .attr("fill", "#334155");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => (d.source as Node).x!)
        .attr("y1", (d: any) => (d.source as Node).y!)
        .attr("x2", (d: any) => (d.target as Node).x!)
        .attr("y2", (d: any) => (d.target as Node).y!);

      node.attr("cx", (d: any) => d.x!).attr("cy", (d: any) => d.y!);

      labels
        .attr("x", (d: any) => d.x!)
        .attr("y", (d: any) => d.y!);
    });

    return () => simulation.stop();
  }, [data]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="400"
      className="rounded-lg border border-slate-200 bg-white"
    ></svg>
  );
}

