import React, { useState } from 'react';
import { Image as ImageIcon, PlayCircle, ExternalLink, Maximize2, X } from 'lucide-react';
import fabricGsmImg from '../assets/images/fabric_gsm_structure_1795211652444.jpg';
import techPackImg from '../assets/images/tech_pack_pattern_1795211654967.jpg';
import trimsPrintingImg from '../assets/images/printing_trims_aql_1795211655276.jpg';
import supplyChainImg from '../assets/images/supply_chain_pathways_1795211655102.jpg';
import {
  buildSourceImageSearchUrl,
  buildYouTubeTutorialUrl,
  extractVideoLinks,
  selectVisualGuidesForText,
  shouldRecommendVideoLinks,
  type CitationLike,
  type VisualGuideId,
} from '../utils/visualGuidesLogic';

const GUIDE_IMAGES: Record<VisualGuideId, string> = {
  fabric_gsm: fabricGsmImg,
  tech_pack_cad: techPackImg,
  trims_printing_aql: trimsPrintingImg,
  supply_chain_pathways: supplyChainImg,
};

interface VisualExplanationPanelProps {
  queryText: string;
  answerText: string;
  citations?: CitationLike[];
  compact?: boolean;
}

export const VisualExplanationPanel: React.FC<VisualExplanationPanelProps> = ({
  queryText,
  answerText,
  citations = [],
  compact = false,
}) => {
  const [zoomedGuideId, setZoomedGuideId] = useState<VisualGuideId | null>(null);
  const combinedText = `${queryText} ${answerText}`;
  const matchedGuides = selectVisualGuidesForText(combinedText);
  const videoCitations = extractVideoLinks(citations);
  const showVideos = shouldRecommendVideoLinks(combinedText, citations);

  const primaryGuide = matchedGuides[0];
  const zoomedGuide = zoomedGuideId ? matchedGuides.find((g) => g.id === zoomedGuideId) : null;

  return (
    <div className="mt-3.5 space-y-3 border-t border-teal-900/10 pt-3">
      {/* Visual Guides from Specified Sources */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-950">
            <ImageIcon className="h-3.5 w-3.5 text-teal-700" />
            <span>توضيحات بالصور والرسوم من مراجع المنظومة</span>
          </div>
          {primaryGuide && (
            <a
              href={buildSourceImageSearchUrl(
                primaryGuide.attributedSources[0].domain,
                primaryGuide.searchQueryEn
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:underline whitespace-nowrap"
            >
              <span>صور إضافية من {primaryGuide.attributedSources[0].name}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className={`grid grid-cols-1 gap-3 ${matchedGuides.length > 1 && !compact ? 'md:grid-cols-2' : ''}`}>
          {(compact ? matchedGuides.slice(0, 1) : matchedGuides).map((guide) => (
            <div
              key={guide.id}
              className="overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white"
            >
              <div className="group relative aspect-video w-full overflow-hidden bg-stone-100">
                <img
                  src={GUIDE_IMAGES[guide.id]}
                  alt={guide.imageAltAr}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <button
                  type="button"
                  onClick={() => setZoomedGuideId(guide.id)}
                  aria-label={`تكبير ${guide.titleAr}`}
                  className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/75 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-xs hover:bg-slate-900"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>تكبير الصورة</span>
                </button>
              </div>

              <div className="p-3">
                <div className="text-xs font-bold text-slate-900">{guide.titleAr}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{guide.captionAr}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-amber-100 pt-2 text-[11px]">
                  <span className="text-slate-500">صور وشروح من مصادرك:</span>
                  {guide.attributedSources.map((src) => (
                    <a
                      key={src.name}
                      href={buildSourceImageSearchUrl(src.domain, guide.searchQueryEn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50/70 px-1.5 py-0.5 font-medium text-teal-900 hover:bg-teal-100"
                    >
                      <span>{src.name}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Links Section when Topic Benefits from Video Demo */}
      {showVideos && (
        <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-l from-indigo-50/70 via-white to-teal-50/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-indigo-950">
            <PlayCircle className="h-4 w-4 text-indigo-700" />
            <span>فيديوهات تعليمية مرتبطة بسؤالك</span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {videoCitations.map((v) => (
              <a
                key={v.uri}
                href={v.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700"
              >
                <PlayCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[230px] truncate">{v.title}</span>
              </a>
            ))}

            {matchedGuides.map((guide) => (
              <a
                key={`yt_${guide.id}`}
                href={buildYouTubeTutorialUrl(
                  `${guide.attributedSources[0].name} ${guide.videoSearchQueryEn}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-indigo-950 hover:border-indigo-400 hover:bg-indigo-50"
              >
                <PlayCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span>فيديوهات {guide.attributedSources[0].name} حول هذا الموضوع</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Zoomed Image */}
      {zoomedGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomedGuide.titleAr}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setZoomedGuideId(null)}
        >
          <div
            className="max-w-4xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-bold text-slate-900">{zoomedGuide.titleAr}</div>
              <button
                type="button"
                onClick={() => setZoomedGuideId(null)}
                aria-label="إغلاق الصورة"
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <img
              src={GUIDE_IMAGES[zoomedGuide.id]}
              alt={zoomedGuide.imageAltAr}
              className="max-h-[75vh] w-full object-contain bg-stone-50"
            />
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700">
              {zoomedGuide.captionAr}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
