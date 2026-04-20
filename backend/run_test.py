import json
from datetime import datetime, date, time
import uuid
from decimal import Decimal

class AuditJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date, time)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

def to_json(data):
    return json.dumps(data, cls=AuditJSONEncoder)

test_data = {"test_time": time(14, 30)}
print(to_json(test_data))
