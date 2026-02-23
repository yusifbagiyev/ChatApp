#!/bin/sh
# Runtime environment dəyişənlərini env.js-ə inject edir.
# Bu sayədə eyni Docker image müxtəlif serverlərdə işləyə bilir.
cat > /usr/share/nginx/html/env.js <<EOF
window.__ENV__ = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:7000}"
};
EOF

exec nginx -g 'daemon off;'
