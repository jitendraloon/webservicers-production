import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { ReleaseVerifier } from "@/server/updater/verifier";
import { UpdateProviderManager } from "@/server/updater/provider-manager";
import { ReleaseBootstrapManager } from "@/server/updater/bootstrap";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("package") as File | null;
    const manifestFile = formData.get("manifest") as File | null;
    const sigFile = formData.get("signature") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "Package file is required." }, { status: 400 });
    }

    const stagingDir = path.join(process.cwd(), "updater", "staging", "manual");
    fs.mkdirSync(stagingDir, { recursive: true });

    const packagePath = path.join(stagingDir, file.name);
    const fileBytes = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(packagePath, fileBytes);

    const manifestPath = path.join(stagingDir, "release-manifest.json");
    const sigPath = path.join(stagingDir, "release-manifest.json.sig");

    if (manifestFile) {
      fs.writeFileSync(manifestPath, Buffer.from(await manifestFile.arrayBuffer()));
    }
    if (sigFile) {
      fs.writeFileSync(sigPath, Buffer.from(await sigFile.arrayBuffer()));
    }

    // If manifest or signature was not uploaded as a separate file, inspect the archive
    if (!manifestFile || !sigFile) {
      const inspectDir = path.join(stagingDir, `inspect_${Date.now()}`);
      try {
        fs.mkdirSync(inspectDir, { recursive: true });
        if (packagePath.endsWith(".zip")) {
          if (process.platform === "win32") {
            execSync(
              `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${packagePath}', '${inspectDir}')"`,
              { stdio: "ignore" }
            );
          } else {
            execSync(`unzip -qo "${packagePath}" -d "${inspectDir}"`, { stdio: "ignore" });
          }
        } else {
          execSync(`tar -xzf "${packagePath}" -C "${inspectDir}"`, { stdio: "ignore" });
        }

        if (!manifestFile) {
          const candidateManifest = path.join(inspectDir, "release-manifest.json");
          if (fs.existsSync(candidateManifest)) {
            fs.copyFileSync(candidateManifest, manifestPath);
          }
        }

        if (!sigFile) {
          const candidateSig = path.join(inspectDir, "release-manifest.json.sig");
          const candidateSigAlt = path.join(inspectDir, "release-signature.sig");
          if (fs.existsSync(candidateSig)) {
            fs.copyFileSync(candidateSig, sigPath);
          } else if (fs.existsSync(candidateSigAlt)) {
            fs.copyFileSync(candidateSigAlt, sigPath);
          }
        }
      } catch (inspectErr) {
        console.warn("[UploadRoute] Package inspection warning:", inspectErr);
      } finally {
        try {
          fs.rmSync(inspectDir, { recursive: true, force: true });
        } catch (_) {}
      }
    }

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing release-manifest.json. Please upload the release-manifest.json alongside the package archive.",
          details: ["The manifest file was neither provided in the upload form nor found inside the root of the archive."],
        },
        { status: 400 }
      );
    }

    if (!fs.existsSync(sigPath)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing digital signature. Please upload the release-manifest.json.sig signature file alongside the package.",
          details: ["Digital signature file (release-manifest.json.sig) is required for cryptographically verifying package integrity."],
        },
        { status: 400 }
      );
    }

    const verifier = new ReleaseVerifier();
    const bootstrap = new ReleaseBootstrapManager();
    const active = bootstrap.resolveActiveRelease();

    const verification = await verifier.verifyRelease(
      manifestPath,
      sigPath,
      packagePath,
      active.version
    );

    if (!verification.valid || !verification.manifest) {
      return NextResponse.json(
        {
          ok: false,
          error: `Verification failed: ${verification.errors.join("; ")}`,
          details: verification.errors,
        },
        { status: 400 }
      );
    }

    // Register with Manual Provider
    const pm = UpdateProviderManager.getInstance();
    pm.getManualProvider().setStagedPackage({
      packagePath,
      manifestPath,
      signaturePath: sigPath,
      manifest: verification.manifest,
    });

    return NextResponse.json({
      ok: true,
      message: `Manual package v${verification.manifest.version} uploaded and cryptographically verified.`,
      manifest: verification.manifest,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to process package upload." },
      { status: 500 }
    );
  }
}
