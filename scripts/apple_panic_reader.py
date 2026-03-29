import asyncio
import json
import re
import sys
from pathlib import Path
from typing import Optional

from pymobiledevice3.lockdown import create_using_usbmux
from pymobiledevice3.services.crash_reports import CrashReportsManager


def extract_latest_panic_details(raw_text: str) -> dict:
    text = raw_text or ""
    details = {
        "PanicLogLatestText": "",
        "PanicLogTimestamp": "",
        "PanicLogBugType": "",
    }

    try:
        payload = json.loads(text)
        if isinstance(payload, dict):
            details["PanicLogLatestText"] = str(payload.get("panicString") or payload.get("reason") or payload.get("description") or "")
            details["PanicLogTimestamp"] = str(payload.get("timestamp") or payload.get("incident") or payload.get("captureTime") or "")
            details["PanicLogBugType"] = str(payload.get("bug_type") or payload.get("bugType") or "")
            return details
    except Exception:
        pass

    panic_match = re.search(r'panicString"\s*:\s*"(.+?)"', text, re.DOTALL)
    if panic_match:
        details["PanicLogLatestText"] = bytes(panic_match.group(1), "utf-8").decode("unicode_escape", errors="ignore")

    bug_match = re.search(r'bug_type"\s*:\s*"?([^",\n]+)', text)
    if bug_match:
        details["PanicLogBugType"] = bug_match.group(1).strip()

    time_match = re.search(r'timestamp"\s*:\s*"([^"]+)"', text)
    if time_match:
        details["PanicLogTimestamp"] = time_match.group(1).strip()

    if not details["PanicLogLatestText"]:
        for line in text.splitlines():
            stripped = line.strip()
            if stripped:
                details["PanicLogLatestText"] = stripped[:500]
                break

    return details


def summarize(items: list[str], latest_text: str = "", latest_timestamp: str = "", latest_bug_type: str = "", latest_path: str = "", local_copy: str = "") -> dict:
    panic_items = [item for item in items if any(token in item.lower() for token in ("panic", "panic-full", "panic-base"))]
    chosen_path = latest_path or (panic_items[0] if panic_items else (items[0] if items else ""))
    return {
        "CrashLogCount": len(items),
        "PanicLogCount": len(panic_items),
        "PanicLogSummary": f"{len(panic_items)} panic log(s)" if panic_items else ("No panic logs found" if items == [] else f"{len(items)} crash log(s), no panic files matched"),
        "PanicLogLatest": chosen_path,
        "PanicLogPaths": panic_items[:20],
        "PanicLogLatestText": latest_text,
        "PanicLogTimestamp": latest_timestamp,
        "PanicLogBugType": latest_bug_type,
        "PanicLogLocalCopy": local_copy,
    }


async def read_panic_logs(udid: Optional[str], out_dir: Optional[str] = None) -> dict:
    errors: list[str] = []
    lockdown = None
    manager = None
    output_dir = Path(out_dir) if out_dir else None
    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)

    serial_candidates = []
    if udid:
        serial_candidates.append(udid)
    serial_candidates.extend([None, udid])
    for serial in serial_candidates:
        try:
            lockdown = await create_using_usbmux(serial=serial)
            manager = CrashReportsManager(lockdown)
            try:
                await manager.flush()
            except Exception:
                pass
            items = await manager.ls("/", 6)
            panic_items = [item for item in items if any(token in item.lower() for token in ("panic", "panic-full", "panic-base"))]
            panic_items = sorted(panic_items, reverse=True)
            latest_text = ""
            latest_timestamp = ""
            latest_bug_type = ""
            latest_path = panic_items[0] if panic_items else ""
            local_copy = ""
            if latest_path:
                latest_raw = await manager.afc.get_file_contents(latest_path)
                latest_text_decoded = latest_raw.decode("utf-8", errors="replace")
                latest_details = extract_latest_panic_details(latest_text_decoded)
                latest_text = latest_details["PanicLogLatestText"]
                latest_timestamp = latest_details["PanicLogTimestamp"]
                latest_bug_type = latest_details["PanicLogBugType"]
                if output_dir:
                    local_path = output_dir / Path(latest_path).name
                    local_path.write_text(latest_text_decoded, encoding="utf-8")
                    local_copy = str(local_path)
            return {"ok": True, **summarize(items, latest_text, latest_timestamp, latest_bug_type, latest_path, local_copy)}
        except Exception as exc:
            errors.append(str(exc))
        finally:
            if manager is not None:
                try:
                    await manager.close()
                except Exception:
                    pass
                manager = None
            if lockdown is not None:
                try:
                    await lockdown.close()
                except Exception:
                    pass
                lockdown = None

    return {
        "ok": False,
        "PanicLogSummary": "Crash service unavailable",
        "error": " | ".join(errors[:3]),
    }


def main() -> None:
    udid = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
    out_dir = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    try:
        result = asyncio.run(read_panic_logs(udid, out_dir))
    except Exception as exc:
        result = {
            "ok": False,
            "PanicLogSummary": "Crash service unavailable",
            "error": str(exc),
        }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
