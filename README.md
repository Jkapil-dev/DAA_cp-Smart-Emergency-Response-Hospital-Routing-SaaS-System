# ResQRoute: Smart Emergency Response & Hospital Routing SaaS System

> **Design and Analysis of Algorithms (DAA) Capstone Project**  
> *Deterministic Graph Optimization, Admissible Heuristic Routing, & Rule-Based Emergency Triage*

---

## 1. Project Overview & Disclaimer

**ResQRoute** is a specialized emergency response and medical facility routing software simulator. It explores how deterministic graph algorithms and explainable rule-based clinical decision systems can optimize emergency response times and clinical acuity matching in simulated urban networks.

> **CRITICAL DISCLAIMER:**  
> **This application is strictly an academic algorithm simulation.** It is **not** a production 911 dispatch console, clinically validated triage tool, or real-time hospital admission platform. It relies on simulated city graphs, synthetic road traffic/closure states, and simulated facility bed censuses.

---

## 2. Core Technical Architecture & Algorithms

### A. Graph Algorithms
The simulated city network is modeled as a directed/undirected weighted graph $G = (V, E)$ where:
- **Vertices ($V$):** Represent urban intersections, ambulance stations/depots, hospital emergency bays, and urgent care clinics.
- **Edges ($E$):** Represent roads with road length ($\text{km}$), speed limits ($\text{km/h}$), calculated base travel time ($\text{minutes} = \frac{\text{distance}}{\text{speed}} \times 60$), and real-time blockage status ($\text{isBlocked}$).

#### 1. Dijkstra's Algorithm
- **Role:** Computes single-source shortest paths on non-negative weighted graphs.
- **Data Structure:** Min-Heap Priority Queue ($O(\log |V|)$ insertion and deletion).
- **Time Complexity:** $O((|V| + |E|) \log |V|)$
- **Space Complexity:** $O(|V| + |E|)$ for adjacency representation, distance maps, and predecessor arrays.

#### 2. A* Search Algorithm
- **Role:** Directs search toward the destination vertex using an admissible heuristic $f(n) = g(n) + h(n)$.
- **Admissible Heuristics:**
  - **Objective: Minimum Distance ($\text{km}$):** Straight-line Euclidean distance lower-bound $h(u) \le d_{\text{road}}(u, \text{target})$.
  - **Objective: Minimum Travel Time ($\text{minutes}$):** Euclidean lower-bound divided by the maximum possible network speed limit ($80\text{ km/h}$):
    $$h(u) = \frac{\text{EuclideanDistance}(u, \text{target})}{\text{MaxNetworkSpeed}}$$
    Because no vehicle on the network can exceed this maximum speed and straight-line distance is always $\le$ actual road distance, $h(n)$ is **strictly admissible and consistent**, guaranteeing optimal paths while reducing evaluated nodes.

#### 3. Multi-Objective Routing
Users can select between **Minimum Travel Time** and **Minimum Distance**. In urban road topologies, a high-speed highway often takes less travel time despite longer distance, while surface streets offer shorter distance at lower speeds. ResQRoute correctly finds different optimal paths for each objective (demonstrated in Scenario 11).

---

## 3. Explainable Rule-Based Severity Engine

Instead of opaque black-box machine learning models, ResQRoute uses a **deterministic, explainable rule engine** with strict priority levels:

| Priority | Severity Level | Decisive Conditions / Triggers | Mandatory Destination | Ambulance Required |
| :--- | :--- | :--- | :--- | :--- |
| **1 (Highest)** | **CRITICAL** | Unconscious/unresponsive, absent breathing, severe uncontrolled bleeding, or trapped in vehicle | Level 1/2 Trauma Center | ALS (Advanced Life Support) |
| **2** | **SEVERE** | Semi-conscious, difficult breathing, suspected major trauma (head/spine/chest), or $\ge 3$ victims | Level 1/2 Trauma Center | ALS (Advanced Life Support) |
| **3** | **MODERATE** | Controlled bleeding, 2 victims, or non-life-threatening fracture requiring surgical evaluation | General Hospital or Trauma Center | BLS or ALS |
| **4 (Lowest)** | **MINOR** | Normal vitals, conscious, superficial lacerations, ambulatory | Urgent Care Clinic (preferred) | BLS |

### Key Rule Engine Properties:
- **Strict Precedence:** Critical rules override any lower-priority signals and log explicit override records.
- **Passive Visual Evidence:** Attached photographs are displayed as visual previews for the human operator; they do not alter deterministic severity rules.
- **Dynamic Recalculation:** When on-scene crews submit updated vitals, severity and destination recommendations recalculate automatically.

---

## 4. Hospital Recommendation & Capacity Override Policy

Hospital selection prioritizes **clinical suitability over simple geographic proximity**:
1. **Clinic Exclusion:** Low-acuity community clinics are **strictly excluded** for Critical and Severe trauma patients, even if located directly across the street from the accident.
2. **Capacity Override for Critical Trauma:** If the closest or only reachable Trauma Center reports $0$ available beds, it is **NOT excluded** from critical trauma triage. It is flagged with an **Emergency Capacity Override**, requiring dispatcher coordination with the charge physician.
3. **Moderate & Minor Acuity Divert:** Moderate and minor cases respect bed availability; facilities with $0$ beds are diverted to avoid emergency department overcrowding.
4. **Transparent Intervention:** If no suitable facility is reachable (e.g., all trauma center access bridges are blocked), the system triggers a **Dispatcher Mutual-Aid Intervention Alert** rather than unsafely routing to an inadequate clinic.

---

## 5. Two-Stage Dispatch Workflow

1. **Stage 1 (Pre-arrival Preparation):**
   - Incident intake and initial severity evaluation.
   - Dispatch fastest available eligible ambulance (ALS prioritized for critical/severe).
   - Compute provisional hospital routes in parallel to minimize decision latency.
2. **Stage 2 (Post-assessment / Patient Pickup):**
   - Field crew submits updated observations and vital signs via on-scene report.
   - Severity and destination re-evaluated in real time.
   - Dispatcher confirms destination and initiates hospital transport.

---

## 6. Automated Scenario Test Suite (14 Tests)

The application includes an in-app scenario runner and automated Vitest test suite (`npm test`) covering all 14 required cases:

1. `SCENARIO-01`: Minor accident routes to suitable nearby clinic.
2. `SCENARIO-02`: Inadequate nearby clinic is excluded for severe accident.
3. `SCENARIO-03`: Critical incident requires Level 1/2 trauma center.
4. `SCENARIO-04`: Trauma hospital with 0 beds remains eligible under capacity override.
5. `SCENARIO-05`: General hospital with 0 beds diverted for moderate incident.
6. `SCENARIO-06`: Occupied/busy ambulance is bypassed in favor of next available unit.
7. `SCENARIO-07`: Road closure on primary bridge forces automatic bypass detour.
8. `SCENARIO-08`: Graph disconnection (closed drawbridge) reports failure clearly.
9. `SCENARIO-09`: Complete trauma cutoff triggers dispatcher mutual-aid intervention.
10. `SCENARIO-10`: Crew on-scene vitals update recalculates triage and destination.
11. `SCENARIO-11`: Distance vs. Travel Time objectives produce diverging optimal paths.
12. `SCENARIO-12`: Critical indicators override and suppress lower-severity signals.
13. `SCENARIO-13`: Attached photographs serve as visual preview without altering logic.
14. `SCENARIO-14`: Provisional hospital route prepared while ambulance is en route to scene.

---

## 7. Installation & Quick Start

### Prerequisites
- **Node.js:** v18.0.0 or later (v25.x tested)
- **npm:** v9.0.0 or later

### Install Dependencies
```bash
npm install
```

### Run Automated Test Suite
```bash
npm test
```
All 19 tests (14 system scenarios + 5 graph algorithm unit tests) run in Vitest.

### Start Local Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:5177/` (or port printed in console).

### Build for Production
```bash
npm run build
```

---

## 8. Known Limitations & Scope Boundaries

- **Simulated Environment:** Does not interface with real-world computer-aided dispatch (CAD) or live hospital Electronic Health Record (EHR) systems.
- **Static Map Graph:** Road network is a simulated topology modeled in SVG rather than a GIS vector tile service.
- **Rule Engine Scope:** Designed as an educational demonstration of deterministic prioritization, not a substitute for formal protocols like Manchester Triage or START.
