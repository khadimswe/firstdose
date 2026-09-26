#!/usr/bin/env swift
import AppKit

// An original typographic mark, not the partner's branding. No downloaded assets.
let side = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: side, pixelsHigh: side,
    bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSColor(srgbRed: 28/255, green: 33/255, blue: 80/255, alpha: 1).setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: CGFloat(side), height: CGFloat(side))).fill()
let mark = "FD" as NSString
let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: 420, weight: .bold),
    .foregroundColor: NSColor.white
]
let size = mark.size(withAttributes: attributes)
mark.draw(at: NSPoint(x: (1024-size.width)/2, y: (1024-size.height)/2+25), withAttributes: attributes)
NSColor(srgbRed: 170/255, green: 143/255, blue: 255/255, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 240, y: 205, width: 544, height: 44), xRadius: 22, yRadius: 22).fill()
NSGraphicsContext.restoreGraphicsState()
let output = URL(fileURLWithPath: "FirstDoseRx/Assets.xcassets/AppIcon.appiconset/AppIcon.png")
try bitmap.representation(using: .png, properties: [:])!.write(to: output, options: .atomic)
print("Generated original FirstDose app icon.")
