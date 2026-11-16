import threading
import queue
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("vision")

class VisionAnalytics:
    def __init__(
        self,
        project_id: str,
        host_url: str = "https://api.visionanalytics.com",
        flush_at: int = 15,
        flush_interval: float = 2.0,
        debug: bool = False
    ):
        self.project_id = project_id
        self.host_url = host_url.rstrip("/")
        self.flush_at = flush_at
        self.flush_interval = flush_interval
        self.debug = debug
        self.queue = queue.Queue(maxsize=10000)
        self.running = True
        
        self.worker_thread = threading.Thread(target=self._worker, daemon=True)
        self.worker_thread.start()

    def _worker(self):
        with httpx.Client(base_url=self.host_url, timeout=10.0) as client:
            while self.running or not self.queue.empty():
                batch = []
                try:
                    event = self.queue.get(timeout=self.flush_interval)
                    batch.append(event)
                    while len(batch) < self.flush_at:
                        try:
                            event = self.queue.get_nowait()
                            batch.append(event)
                        except queue.Empty:
                            break
                except queue.Empty:
                    pass
                
                if batch:
                    self._send_batch(client, batch)
                    
    def _send_batch(self, client: httpx.Client, batch: list):
        for item in batch:
            try:
                endpoint = item.get("endpoint", "/api/send")
                payload = item.get("payload")
                
                if endpoint == "/api/send":
                    body = {"type": item.get("type", "event"), "payload": payload}
                else:
                    body = payload

                res = client.post(endpoint, json=body)
                if self.debug and res.status_code >= 400:
                    logger.warning(f"Vision API Error {res.status_code}: {res.text}")
            except Exception as e:
                if self.debug:
                    logger.warning(f"Vision failed to send event: {e}")
            finally:
                self.queue.task_done()

    def add_raw(self, payload: Dict[str, Any], endpoint: str = "/api/send", event_type: str = "event"):
        if not self.running:
            return
        payload["project"] = self.project_id
        try:
            self.queue.put_nowait({
                "payload": payload,
                "endpoint": endpoint,
                "type": event_type
            })
        except queue.Full:
            if self.debug:
                logger.warning("Vision queue is full, dropping event")

    def track(self, name: str, data: Optional[Dict[str, Any]] = None):
        self.add_raw({
            "name": name,
            "data": data or {}
        }, event_type="event")

    def identify(self, user_id: str, traits: Optional[Dict[str, Any]] = None):
        self.add_raw({
            "id": user_id,
            "data": traits or {}
        }, event_type="identify")

    def flush(self):
        self.queue.join()

    def shutdown(self):
        self.running = False
        self.worker_thread.join()

SigmaAnalytics = VisionAnalytics
_global_client: Optional[VisionAnalytics] = None

def init(project_id: str, **kwargs):
    global _global_client
    if _global_client is None:
        _global_client = VisionAnalytics(project_id, **kwargs)

def get_client() -> Optional[VisionAnalytics]:
    return _global_client

def track(name: str, data: Optional[Dict[str, Any]] = None):
    if _global_client:
        _global_client.track(name, data)

def identify(user_id: str, traits: Optional[Dict[str, Any]] = None):
    if _global_client:
        _global_client.identify(user_id, traits)

def flush():
    if _global_client:
        _global_client.flush()

def shutdown():
    global _global_client
    if _global_client:
        _global_client.shutdown()
        _global_client = None
