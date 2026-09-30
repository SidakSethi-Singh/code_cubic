import json
from pathlib import Path

GOLDEN_MEMORIES = [
    {
        "mem_id": "10420000-0000-0000-0000-000000001042",
        "title": "P-204 Coupling Torquing Calibration Standard",
        "content": "P-204 Coupling Torquing Calibration Standard. Torque sequence requires cross-pattern tightening in 40 Nm increments up to 145 Nm final. Over-torquing leads to asymmetric preload, triggering bearing race deflection and severe grinding noise above 1,750 RPM.",
        "kind": "manual",
        "authority": 3,
        "status": "active",
        "sync_state": "synced",
        "scope": "fleet",
        "site_id": "Plant North",
        "asset_id": "P-204",
        "asset_type": "Slurry Pump",
        "source_device": "Fleet Baseline Rev 12",
        "target_shard": "fleet_mirror",
        "payload": {
            "title": "P-204 Coupling Torquing Calibration Standard",
            "doc_ref": "#MS-771-A",
            "torque_nm": 145
        }
    },
    {
        "mem_id": "08710000-0000-0000-0000-000000000871",
        "title": "Slurry Impeller Deflection Incidents • North Plant Pit",
        "content": "Slurry Impeller Deflection Incidents • North Plant Pit. Slurry pump P-204 experienced structural high-frequency grinding noise at high load under 88% operational capacity. Shaft balance runout confirmed 0.38mm axial deviation caused by over-torqued coupling bolts found at 210 Nm in past incidents.",
        "kind": "incident",
        "authority": 2,
        "status": "active",
        "sync_state": "synced",
        "scope": "site",
        "site_id": "Plant North",
        "asset_id": "P-204",
        "asset_type": "Slurry Pump",
        "source_device": "Device A",
        "target_shard": "device_memory",
        "payload": {
            "title": "Slurry Impeller Deflection Incidents • North Plant Pit",
            "doc_ref": "#IN-8042",
            "provenance": "learned from Device A - verified"
        }
    },
    {
        "mem_id": "01190000-0000-0000-0000-000000000119",
        "title": "P-200 Series Bearing Lubricant Schedule [FORK DETECTED]",
        "content": "P-200 Series Bearing Lubricant Schedule. Local record specifies synthetic ISO VG 220 greasing every 500 operating hours. Inspect inboard mechanical seal faces for premature scoring before complete bearing seizure occurs.",
        "kind": "bulletin",
        "authority": 2,
        "status": "disputed",
        "sync_state": "conflict",
        "scope": "site",
        "site_id": "Plant North",
        "asset_id": "P-204",
        "asset_type": "Slurry Pump",
        "source_device": "Device B",
        "target_shard": "device_memory",
        "payload": {
            "title": "P-200 Series Bearing Lubricant Schedule [FORK DETECTED]",
            "doc_ref": "#FL-2024-883"
        }
    },
    {
        "mem_id": "14020000-0000-0000-0000-000000001402",
        "title": "Vibration Telemetry Snapshot: High-Load Sweep",
        "content": "Vibration Telemetry Snapshot: High-Load Sweep. Frequency sweep captures spike at 1,780 RPM matching 142.3 Hz acoustic resonance. Acoustic mic probe recorded 94 dBA in pump casing interior during grinding events.",
        "kind": "sensor",
        "authority": 1,
        "status": "active",
        "sync_state": "pending",
        "scope": "device",
        "site_id": "Plant North",
        "asset_id": "P-204",
        "asset_type": "Slurry Pump",
        "source_device": "Device A",
        "target_shard": "device_memory",
        "payload": {
            "title": "Vibration Telemetry Snapshot: High-Load Sweep",
            "doc_ref": "#RAW-994-01"
        }
    },
    {
        "mem_id": "00820000-0000-0000-0000-000000000082",
        "title": "Legacy Manual Override: Slurry Gate Valves P-200",
        "content": "Legacy Manual Override: Slurry Gate Valves P-200. Deprecated reference replaced by dynamic balancing protocol Rev 4.1. Direct hand-wheel operation recommended for flow throttling during baseline maintenance.",
        "kind": "manual",
        "authority": 1,
        "status": "superseded",
        "sync_state": "synced",
        "scope": "fleet",
        "site_id": "Plant North",
        "asset_id": "P-204",
        "asset_type": "Slurry Pump",
        "source_device": "OEM Base Rev 1.0",
        "target_shard": "fleet_mirror",
        "payload": {
            "title": "Legacy Manual Override: Slurry Gate Valves P-200",
            "doc_ref": "#MAN-2018-09"
        }
    }
]

def generate_fleet_seed_data(total_records=450):
    assets = [
        ("P-204", "Slurry Pump", "Plant North"),
        ("C-102", "Gas Compressor", "Plant South"),
        ("T-34", "Gas Turbine", "Plant South"),
        ("V-109", "Refinery Actuator", "Refinery Unit 2"),
        ("H-03", "Autonomous Crawler", "Drone Rig 03"),
        ("M-50", "Subsea Manifold", "Plant East")
    ]
    subsystems = ["bearing housing", "mechanical seal", "suction impeller", "drive coupling", "lube manifold", "casing flange"]
    issues = [
        ("thermal expansion above 82 C", "flush cooling line and inspect seal face"),
        ("cavitation noise under heavy suction load", "adjust suction throttle to 1.8 bar head pressure"),
        ("eccentric runout exceeding 0.35mm", "re-align flexible coupling and torque bolts to 145 Nm"),
        ("vibration harmonic peak at 2.4x order", "replace outboard cylindrical roller bearing SKF-7314"),
        ("grease leakage around labyrinth isolator", "re-pack with synthetic ISO VG 220 grease"),
        ("pressure drop across strainer exceeding 0.6 bar", "switch to parallel filter bank and blowdown strainer")
    ]

    all_data = list(GOLDEN_MEMORIES)
    for i in range(len(GOLDEN_MEMORIES), total_records):
        asset_id, asset_type, site = assets[i % len(assets)]
        subsys = subsystems[i % len(subsystems)]
        issue, fix = issues[i % len(issues)]
        kind = "manual" if i % 5 == 0 else ("incident" if i % 3 == 0 else "fix")
        auth = 3 if kind == "manual" else (2 if kind == "incident" else 1)
        uuid_str = f"20000000-0000-0000-0000-{i:012d}"
        
        content = (
            f"Asset {asset_id} ({asset_type}) at {site} {subsys} maintenance procedure #{1000 + i}. "
            f"Observed condition: {issue}. Standard corrective remediation: {fix}."
        )
        all_data.append({
            "mem_id": uuid_str,
            "title": f"{asset_id} {subsys.title()} Maintenance #{1000 + i}",
            "content": content,
            "kind": kind,
            "authority": auth,
            "status": "active",
            "sync_state": "synced" if auth >= 2 else "local_only",
            "scope": "fleet" if auth == 3 else "site",
            "site_id": site,
            "asset_id": asset_id,
            "asset_type": asset_type,
            "source_device": "Device A" if site == "Plant North" else "Device B",
            "target_shard": "fleet_mirror" if kind == "manual" else "device_memory",
            "payload": {
                "title": f"{asset_id} {subsys.title()} Maintenance #{1000 + i}",
                "doc_ref": f"#DOC-{2000 + i}"
            }
        })
    return all_data

if __name__ == "__main__":
    out_dir = Path("data/seed")
    out_dir.mkdir(parents=True, exist_ok=True)
    dataset = generate_fleet_seed_data(450)
    out_file = out_dir / "seed_memories.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"Generated {len(dataset)} records into {out_file}")
