function deviceLabel(device) {
  if (!device) return ""
  return String(device.deviceName || device.name || "").trim()
}

// Label for display in lists. Falls back to the raw address so anonymous
// devices (MAC- or UUID-only advertisers) are still visible — and therefore
// still hideable — rather than dropped entirely by hasHumanName().
function displayLabel(device) {
  if (!device) return ""
  var label = deviceLabel(device)
  if (label !== "") return label
  return String(device.address || "").trim()
}

function toArray(values) {
  if (!values) return []
  if (Array.isArray(values)) return values.slice()

  var length = Number(values.length || 0)
  if (!isFinite(length) || length <= 0) return []

  var list = []
  for (var i = 0; i < length; i++) list.push(values[i])
  return list
}

function isUuidLike(value) {
  var text = String(value || "").trim()
  if (text === "") return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)
    || /^[0-9a-f]{32}$/i.test(text)
    || /^0x[0-9a-f]{4,32}$/i.test(text)
    || /^0000[0-9a-f]{4}-0000-1000-8000-00805f9b34fb$/i.test(text)
}

function isAddressLike(value) {
  var text = String(value || "").trim()
  return /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(text)
}

function normalizedAddress(value) {
  return String(value || "").trim().toLowerCase().replace(/[^0-9a-f]/g, "")
}

function hasHumanName(device) {
  var label = deviceLabel(device)
  return label !== "" && !isUuidLike(label) && !isAddressLike(label)
}

function nodeProps(node) {
  return node && node.ready && node.properties ? node.properties : {}
}

function nodeText(node) {
  var props = nodeProps(node)
  return [
    node ? node.name : "",
    node ? node.description : "",
    node ? node.nickname : "",
    node ? node.nick : "",
    props["node.name"],
    props["node.description"],
    props["node.nick"],
    props["device.name"],
    props["device.description"],
    props["device.product.name"],
    props["device.alias"],
    props["device.string"],
    props["api.bluez5.address"],
    props["bluez5.address"],
    props["media.name"]
  ].join(" ").toLowerCase()
}

function bluetoothSinkMatchesDevice(node, device) {
  if (!node || !node.isSink || node.isStream || !device) return false

  var address = normalizedAddress(device.address)
  var text = nodeText(node)
  if (address !== "" && normalizedAddress(text).indexOf(address) !== -1) return true

  var label = deviceLabel(device).toLowerCase()
  return label !== "" && text.indexOf(label) !== -1
}

function sortedByLabel(devices) {
  var list = toArray(devices)
  list.sort(function(a, b) { return displayLabel(a).localeCompare(displayLabel(b)) })
  return list
}

// Primitives-only projection of a BlueZ device for list-model rows. Holding
// the Device QObject in model data puts a live wrapper into every delegate's
// var property, and BlueZ churn (discovery timeouts, unpair) can destroy the
// object while a delegate is still incubating, which segfaults quickshell.
// Actions resolve the backend object via Panel.deviceFor().
function deviceRow(d) {
  if (!d) return null
  return {
    address: d.address || "",
    name: d.name || "",
    deviceName: d.deviceName || "",
    connected: !!d.connected,
    state: d.state !== undefined ? d.state : -1,
    batteryAvailable: !!d.batteryAvailable,
    battery: d.battery !== undefined ? d.battery : 0,
    pairing: !!d.pairing,
    icon: d.icon || ""
  }
}

// Map BlueZ "icon" class strings to Nerd Font glyphs.
// Connected devices prefer the connected variant (e.g. 󰂱); the panel's
// DeviceRow applies connected overrides on top of this map.
function deviceIconGlyph(bluezIcon) {
  if (!bluezIcon) return ""
  var lo = bluezIcon.toLowerCase()
  if (lo.indexOf("headset") !== -1 || lo.indexOf("headphone") !== -1) return "󰋋"
  if (lo.indexOf("speaker") !== -1 || lo.indexOf("audio-card") !== -1) return "󰓃"
  if (lo.indexOf("keyboard") !== -1) return "󰌌"
  if (lo.indexOf("mouse") !== -1) return "󰍽"
  if (lo.indexOf("gaming") !== -1) return "󰊖"
  if (lo.indexOf("phone") !== -1) return "󰏲"
  if (lo.indexOf("computer") !== -1 || lo.indexOf("laptop") !== -1 || lo.indexOf("desktop") !== -1) return "󰌢"
  if (lo.indexOf("camera") !== -1 || lo.indexOf("video") !== -1 || lo.indexOf("display") !== -1) return "󰄀"
  if (lo.indexOf("watch") !== -1) return "󰂷"
  if (lo.indexOf("tablet") !== -1) return "󰀂"
  if (lo.indexOf("modem") !== -1 || lo.indexOf("network") !== -1 || lo.indexOf("tethering") !== -1) return "󰢧"
  if (lo.indexOf("printer") !== -1) return "󰐪"
  if (lo.indexOf("scanner") !== -1) return "󰈛"
  return ""
}

// Map a battery level (0–100) to a Nerd Font Material Design battery glyph,
// in 10% steps: the outline at empty and the filled icon at full. Paired with
// the numeric percentage shown next to it, so the glyph is a glanceable hint
// rather than a precise reading.
function batteryGlyph(level) {
  var lvl = Number(level)
  if (!isFinite(lvl)) return ""
  if (lvl >= 100) return "󰁹"   // battery (full)
  if (lvl >= 90) return "󰂂"    // battery-90
  if (lvl >= 80) return "󰂁"    // battery-80
  if (lvl >= 70) return "󰂀"    // battery-70
  if (lvl >= 60) return "󰁿"    // battery-60
  if (lvl >= 50) return "󰁾"    // battery-50
  if (lvl >= 40) return "󰁽"    // battery-40
  if (lvl >= 30) return "󰁼"    // battery-30
  if (lvl >= 20) return "󰁻"    // battery-20
  if (lvl >= 10) return "󰁺"    // battery-10
  return "󰂎"                   // battery-outline (empty)
}

// True when a device's address is present in the ignored set. `ignored` is a
// plain object keyed by normalized address (see Panel.qml), so a lookup here
// is a cheap hasOwnProperty rather than a scan.
function isIgnored(device, ignored) {
  if (!device || !ignored) return false
  var addr = normalizedAddress(device.address)
  return addr !== "" && Object.prototype.hasOwnProperty.call(ignored, addr)
}

function deviceLists(devices, ignored, showAnonymous) {
  var values = toArray(devices)
  var connected = []
  var known = []
  var discovered = []

  for (var i = 0; i < values.length; i++) {
    var d = values[i]
    if (!d) continue
    // Keep anonymous devices (no human-readable name) in the discovered
    // list, labeled by address, so they can be hidden from scans too. The
    // panel's "show anonymous" toggle can drop them from the scan results,
    // but connected and paired devices always stay visible.
    if (!hasHumanName(d) && displayLabel(d) === "") continue
    if (d.connected) connected.push(d)
    else if (d.paired || d.bonded || d.trusted) known.push(d)
    else if (!isIgnored(d, ignored) && (showAnonymous || hasHumanName(d))) discovered.push(d)
  }

  return {
    connected: sortedByLabel(connected),
    known: sortedByLabel(known),
    discovered: sortedByLabel(discovered)
  }
}

function cloneMap(map) {
  var next = ({})
  for (var key in map || {}) next[key] = map[key]
  return next
}

// Pending-action entries are { action, expires } objects keyed by address.
// `expires` is an epoch in milliseconds; expiredPending() sweeps stale entries
// so each action ages out independently instead of a single global timeout
// clearing every in-flight action at once.
function pendingAction(actions, address) {
  if (!address || !actions) return ""
  var entry = actions[address]
  return entry && typeof entry === "object" ? (entry.action || "") : ""
}

function withPendingAction(actions, address, action, ttl) {
  var next = cloneMap(actions)
  if (!address) return next
  if (action) next[address] = { action: action, expires: Date.now() + (ttl || 20000) }
  else delete next[address]
  return next
}

function expiredPending(actions, now) {
  if (!actions) return actions
  var next = null
  for (var key in actions) {
    var entry = actions[key]
    if (entry && typeof entry === "object" && entry.expires > now) continue
    if (next === null) next = cloneMap(actions)
    delete next[key]
  }
  return next === null ? actions : next
}

function visibleSections(lists, discovering) {
  var sections = []
  if (lists && lists.connected && lists.connected.length > 0) sections.push("connected")
  if (lists && lists.known && lists.known.length > 0) sections.push("known")
  if (discovering && lists && lists.discovered && lists.discovered.length > 0) sections.push("discovered")
  return sections
}

function sectionDevices(lists, section) {
  if (!lists) return []
  if (section === "connected") return lists.connected || []
  if (section === "known") return lists.known || []
  if (section === "discovered") return lists.discovered || []
  return []
}

// Case-insensitive substring match over the display label and raw address,
// used by the panel's filter box.
function matchesQuery(device, query) {
  var q = String(query || "").trim().toLowerCase()
  if (q === "") return true
  var haystack = (displayLabel(device) + " " + String(device.address || "")).toLowerCase()
  return haystack.indexOf(q) !== -1
}

function filterList(list, query) {
  var out = []
  var values = toArray(list)
  for (var i = 0; i < values.length; i++) {
    if (matchesQuery(values[i], query)) out.push(values[i])
  }
  return out
}

// Returns `lists` unchanged when the query is empty (so callers keep identity
// and avoid needless model rebuilds); otherwise a filtered copy of each list.
function filterLists(lists, query) {
  var q = String(query || "").trim()
  if (q === "") return lists
  return {
    connected: filterList(lists ? lists.connected : null, q),
    known: filterList(lists ? lists.known : null, q),
    discovered: filterList(lists ? lists.discovered : null, q)
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    deviceLabel: deviceLabel,
    displayLabel: displayLabel,
    toArray: toArray,
    isUuidLike: isUuidLike,
    isAddressLike: isAddressLike,
    normalizedAddress: normalizedAddress,
    hasHumanName: hasHumanName,
    nodeProps: nodeProps,
    nodeText: nodeText,
    bluetoothSinkMatchesDevice: bluetoothSinkMatchesDevice,
    isIgnored: isIgnored,
    sortedByLabel: sortedByLabel,
    deviceRow: deviceRow,
    deviceIconGlyph: deviceIconGlyph,
    batteryGlyph: batteryGlyph,
    deviceLists: deviceLists,
    cloneMap: cloneMap,
    pendingAction: pendingAction,
    withPendingAction: withPendingAction,
    expiredPending: expiredPending,
    visibleSections: visibleSections,
    sectionDevices: sectionDevices,
    matchesQuery: matchesQuery,
    filterLists: filterLists
  }
}
