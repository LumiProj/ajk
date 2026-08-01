import Foundation
import Vision
import AppKit

struct Box: Codable {
  let text: String
  let confidence: Float
  let x: Double
  let y: Double
  let w: Double
  let h: Double
}

struct PageOCR: Codable {
  let path: String
  let boxes: [Box]
}

let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let tiff = img.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else {
  fputs("failed to load \(path)\n", stderr)
  exit(1)
}

let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
if #available(macOS 13.0, *) {
  req.recognitionLanguages = ["en-US", "ar", "ur"]
  req.automaticallyDetectsLanguage = true
}

try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
var boxes: [Box] = []
for obs in req.results ?? [] {
  guard let c = obs.topCandidates(1).first else { continue }
  let b = obs.boundingBox
  boxes.append(
    Box(
      text: c.string,
      confidence: c.confidence,
      x: Double(b.minX),
      y: Double(b.minY),
      w: Double(b.width),
      h: Double(b.height)
    )
  )
}

let out = PageOCR(path: path, boxes: boxes)
let data = try JSONEncoder().encode(out)
if let s = String(data: data, encoding: .utf8) {
  print(s)
}
