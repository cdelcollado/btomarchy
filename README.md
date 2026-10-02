# btomarchy

An [Omarchy](https://omarchy.org/) Bluetooth bar widget — a fork of the
built-in `omarchy.bluetooth` that lets you **hide devices you don't want to
see while scanning**.

Living in an apartment, a Bluetooth scan can list every device belonging to
your neighbours. With this plugin you can mark any discovered device as
*hidden*, and it will never appear in a scan again — while your own connected
and paired devices are always shown.

## Features

- Connect / disconnect / forget devices (everything the stock widget does).
- **Hide** any discovered device from future scans (eye-off button).
- A **HIDDEN** section at the bottom of the panel lists hidden devices, so a
  mistaken hide can be undone with one click (eye button).
- **Filter** the device list by name or address (the box under the header, or
  press `/`).
- **Show MAC addresses** with the `MAC` toggle, to tell same-named neighbours
  apart.
- **Show or hide anonymous devices** (MAC- or UUID-only advertisers) with the
  `ANON` toggle — collapse the neighbour-noise wall in one click.
- Connected devices that report a battery level show a **battery percentage**
  next to their name (mice, headsets, keyboards, … where BlueZ exposes it).
- **Right-click** any device for a context menu (Connect / Disconnect /
  Forget / Hide from scans).
- Device rows show an **icon by device type** (headset, keyboard, mouse,
  phone, …) where BlueZ reports one.
- Anonymous devices (MAC- or UUID-only advertisers) appear in the
  **AVAILABLE** list — labeled by address — so they can be hidden individually
  or in bulk with the `ANON` toggle.
- Hidden devices are persisted in
  `~/.local/state/omarchy/bluetooth-ignored.json` and survive shell restarts
  and `omarchy update`.

## Requirements

This plugin runs inside Omarchy's shell and uses these built-in Omarchy
commands, which ship with every Omarchy install:

- `omarchy-bluetooth-device` — connect / disconnect / forget / pair.
- `omarchy-bluetooth-power` — toggle the adapter's soft rfkill block.

No other dependencies.

## Install

```bash
omarchy plugin add https://github.com/cdelcollado/btomarchy --enable
```

If the widget doesn't appear in your bar automatically, place it:

```bash
omarchy plugin enable cdelcollado.bluetooth
```

**Note:** `allowMultiple` is `false`, so make sure the built-in
`omarchy.bluetooth` is disabled if you have both installed.

## Remove

```bash
omarchy plugin remove cdelcollado.bluetooth
```

Your hidden-device list (`~/.local/state/omarchy/bluetooth-ignored.json`) is
left in place, so reinstalling the plugin brings your hidden devices back.
Delete that file if you want to start fresh.

## Usage

1. Click the Bluetooth icon in the bar.
2. Let it scan (or keep the panel open — it rescans automatically).
3. Hover a device under **AVAILABLE** and click the eye-off button (`󰈉`,
   tooltip "Hide") — or right-click the device and pick **Hide from scans**.
4. To restore a device, open the **HIDDEN** section at the bottom and click
   the eye button (`󰈈`, tooltip "Show again").

The `MAC` and `ANON` toggles under the filter box control whether raw addresses
and nameless advertisers are shown, respectively. Battery percentage appears
automatically on connected devices that report it — no configuration needed.

Keyboard (once the panel is open): `j`/`k` move through the list, `Enter`
connects/disconnects, `x` forgets, `b` toggles Bluetooth, `/` focuses the
filter box, `Esc` clears the filter.

## Development

The interesting bits:

- `Model.js` — device grouping, the `isIgnored` hide filter, the anonymous
  (`showAnonymous`) scan filter, and the `batteryGlyph` level-to-glyph map.
- `Panel.qml` — the panel UI, the hide/unhide buttons, JSON persistence, the
  `MAC`/`ANON` toggles, and the battery indicator on device rows.

Validate a local copy before publishing:

```bash
omarchy plugin validate .
```

## License

[MIT](LICENSE). Derived from Omarchy's `omarchy.bluetooth` first-party
plugin, also MIT licensed. See [Omarchy](https://omarchy.org/) for upstream
licensing.
