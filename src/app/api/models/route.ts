import { NextResponse } from "next/server";
import {
  defaultModelId,
  liveModels,
  type GenerationModel,
  type Modality,
} from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(model: GenerationModel) {
  return {
    id: model.id,
    name: model.name,
    modality: model.modality,
    provider: model.provider,
    mockCredits: model.mockCredits,
    tagline: model.tagline,
    durations: model.durations,
    nsfw: Boolean(model.nsfw),
    previewLoop: model.previewLoop,
    previewPoster: model.previewPoster,
  };
}

export async function GET() {
  const models = liveModels().map(serialize);
  let imageDefault = "";
  let videoDefault = "";
  try {
    imageDefault = defaultModelId("image");
  } catch {
    // no live image models
  }
  try {
    videoDefault = defaultModelId("video");
  } catch {
    // no live video models
  }

  const byModality = (modality: Modality) =>
    models.filter((model) => model.modality === modality);

  return NextResponse.json({
    models,
    imageModels: byModality("image"),
    videoModels: byModality("video"),
    imageDefault,
    videoDefault,
  });
}
