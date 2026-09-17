# LANDGUARD-X

### AI-Powered Landslide Susceptibility, Risk Intelligence & Decision Support Platform

> **From terrain intelligence to actionable disaster response.**

LANDGUARD-X is an AI-powered landslide intelligence platform designed for vulnerable regions of India. It combines historical landslide inventories, terrain and soil characteristics, machine learning-based susceptibility estimation, dynamic environmental risk factors, geospatial visualization, citizen reporting, and authority-focused decision support into a single platform.

The system is designed around one core idea:

**Understand where landslides are naturally more likely, combine that with changing environmental conditions, and convert the information into actionable risk intelligence.**

---

## Overview

Landslides are influenced by a combination of relatively stable physical factors and rapidly changing environmental conditions.

LANDGUARD-X separates these two dimensions:

### 1. Static Susceptibility

Answers:

> **"How naturally prone is this terrain to landslides?"**

The machine learning model uses terrain and soil characteristics to estimate landslide susceptibility.

### 2. Dynamic Risk

Answers:

> **"How risky is the location under the current environmental conditions?"**

The risk engine combines susceptibility with dynamic factors such as rainfall, soil moisture, and exposure-related information.

### 3. Decision Support

Answers:

> **"What should citizens, responders, and authorities focus on?"**

The platform provides maps, forecasts, factor explanations, citizen reports, incidents, response information, and analytics.

---

# Key Features

## AI-Based Landslide Susceptibility

A trained Random Forest model estimates static landslide susceptibility using eight terrain and soil features:

- Elevation
- Slope
- Soil Clay Content
- Soil Sand Content
- Soil Silt Content
- Soil pH
- Soil Organic Carbon
- Soil Bulk Density

The model produces a susceptibility probability and a normalized 0–100 susceptibility score.

---

## Explainable Risk Intelligence

Instead of displaying only a risk number, LANDGUARD-X breaks risk into understandable contributing factors.

The platform distinguishes between:

- **Susceptibility** — long-term terrain proneness
- **Triggers** — changing environmental conditions
- **Exposure** — people and infrastructure potentially affected

This makes the system more suitable for decision support rather than simply producing a black-box prediction.

---

## Geospatial Risk Map

The platform provides a GIS-based interface for exploring risk across locations.

The map is designed to help users:

- Identify high-risk areas
- Compare locations
- Understand spatial risk patterns
- Inspect location-specific information
- Support authority-level prioritization

---

## 48-Hour Risk Forecast

LANDGUARD-X provides a short-term risk trend view to help users understand how risk conditions may evolve.

The forecast interface includes:

- Risk trend
- Time-based risk visualization
- Environmental conditions
- Expected risk changes

The current implementation is a prototype decision-support forecast and should not be interpreted as an operational disaster prediction system.

---

## What-If Scenario Simulator

Users can modify environmental conditions and observe how the calculated risk changes.

For example:

**Increase rainfall → trigger risk increases → overall risk changes**

This allows authorities and users to explore hypothetical scenarios rather than relying only on a single static risk value.

---

## Citizen Hazard Reporting

Citizens can:

- Report suspected hazards
- Upload hazard photographs
- Submit location information
- Create incident reports

Citizen reports can be incorporated into the authority workflow for further review and response.

---

## Authority Command Center

The authority interface provides a consolidated operational view of:

- Active incidents
- Risk zones
- Priority locations
- Citizen reports
- Response status
- Emergency resources
- Recommended actions

The goal is to reduce the gap between **risk detection and coordinated response**.

---

## Incident Management

The platform supports an incident lifecycle including:

```text
Citizen / System Report
        ↓
Incident Creation
        ↓
Authority Review
        ↓
Priority Assessment
        ↓
Response Dispatch
        ↓
Status Tracking
