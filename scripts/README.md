# Build-time data scripts.
#
# Planned (mirror iso-tc154/www.isotc154.org/scripts/):
#   build-data.mjs            — loads _data/*.yaml → public/data/*.json
#   prepare-edoxen-data.mjs   — stages resolutions/ + events/ into -edoxen/ dirs
#   build-legacy-redirects.mjs— per-decision / per-meeting redirects
#   sync_iso_open_data.rb     — weekly sync of standards catalogue from ISO Open Data
#   validate_yaml.rb          — schema validation for _data/ YAML
#   validate_member_status.rb — member status consistency checks
#   lib/                      — shared loaders (members, events, resolutions, standards)
