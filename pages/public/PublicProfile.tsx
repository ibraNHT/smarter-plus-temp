import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../services/storeContext";
import { useTranslation } from "../../services/i18nContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { ProducerStatus, Review } from "../../types";
import {
  User,
  MapPin,
  ShieldCheck,
  Star,
  ArrowLeft,
  Package,
  Image as ImageIcon,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { apiFetch } from "../../services/apiService";
import { API_ENDPOINTS } from "../../client-api/endpoints";
import { PublicProfileSkeleton } from "../../components/skeletons/PublicProfileSkeleton";
import { offerImageHero, offerImageInBox } from "../../utils/offerImageDisplay";
import { displayNameTruncateClass } from "../../utils/displayName";
import { canonicalizeCategoryList } from "../../data/categories";
import { SEO } from "../../components/SEO";
import { buildProducerProfileSchema } from "../../services/seo/schemaBuilders";
import { unitLabel } from '../../utils/unitLabel';
import { ReportBlockControl } from '../../components/ReportBlockControl';

function mapReviewRow(r: any): Review {
  const pic = r.reviewerProfileImageUrl;
  const picStr = typeof pic === "string" && pic.trim() ? pic.trim() : undefined;
  return {
    id: String(r.id),
    orderId: String(r.orderId),
    reviewerId: String(r.reviewerId),
    targetId: String(r.targetId),
    rating: Number(r.rating) || 0,
    comment: typeof r.comment === "string" ? r.comment : "",
    createdAt:
      typeof r.createdAt === "string"
        ? r.createdAt
        : new Date(r.createdAt ?? 0).toISOString(),
    reviewerDisplayName:
      typeof r.reviewerDisplayName === "string" ? r.reviewerDisplayName : undefined,
    reviewerProfileImageUrl: picStr,
  };
}

interface PublicProfileProps {
  role: "PRODUCER" | "CLIENT";
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ role }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    producers,
    clients,
    getProducerOffers,
    refreshProducers,
    refreshClients,
    refreshOffers,
    loadPublicProfileById,
    user,
  } = useStore();
  const { t, language } = useTranslation();
  const { formatXaf } = useCurrency();

  // Public profile needs the producers/clients/offers catalogs. `pageLoading`
  // scopes the full-page skeleton to this page so it falls when (cached)
  // requests resolve.
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    Promise.all([refreshProducers(), refreshClients(), refreshOffers()]).finally(() => {
      if (!cancelled) setPageLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const [profileData, setProfileData] = useState<any>(null);
  const [profileReviews, setProfileReviews] = useState<Review[]>([]);
  const [producerPortfolios, setProducerPortfolios] = useState<any[]>([]);
  const [portfolioSlideIdx, setPortfolioSlideIdx] = useState<Record<string, number>>({});
  const [openPortfolio, setOpenPortfolio] = useState<any | null>(null);
  const [openPortfolioMediaIdx, setOpenPortfolioMediaIdx] = useState(0);

  useEffect(() => {
    if (role === "PRODUCER") {
      const producer = producers.find((p) => p.id === id);
      setProfileData(producer);
    } else {
      const client = clients.find((c) => c.id === id);
      setProfileData(client);
    }
  }, [id, role, producers, clients]);

  // The store catalogs are not guaranteed to hold this profile: the clients
  // catalog only ever contains the viewer's own buyer profile (and nothing for
  // anonymous visitors), so a shared /profile/client/:id link showed "User not
  // found" for practically everyone. Resolve it directly when it's missing.
  const [profileLookupSettled, setProfileLookupSettled] = useState(false);
  const profileLookupKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id) return;
    const key = `${role}:${id}`;
    if (profileLookupKeyRef.current === key) return;
    profileLookupKeyRef.current = key;
    setProfileLookupSettled(false);
    const alreadyInStore =
      role === "PRODUCER"
        ? producers.some((p) => p.id === id)
        : clients.some((c) => c.id === id);
    if (alreadyInStore) {
      setProfileLookupSettled(true);
      return;
    }
    void loadPublicProfileById(role, id).finally(() => {
      if (profileLookupKeyRef.current === key) setProfileLookupSettled(true);
    });
  }, [id, role]);

  useEffect(() => {
    const uid = profileData?.userId;
    if (!uid) {
      setProfileReviews([]);
      return;
    }
    let cancelled = false;
    apiFetch<any[]>(API_ENDPOINTS.reviews.byUser(uid))
      .then((rows) => {
        if (cancelled) return;
        setProfileReviews(Array.isArray(rows) ? rows.map(mapReviewRow) : []);
      })
      .catch(() => {
        if (!cancelled) setProfileReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [profileData?.userId]);

  useEffect(() => {
    if (role !== "PRODUCER" || !id) {
      setProducerPortfolios([]);
      return;
    }
    let cancelled = false;
    apiFetch<any[]>(API_ENDPOINTS.portfolios.publicByProducer(id), { silent401: true } as any)
      .then((rows) => {
        if (cancelled) return;
        setProducerPortfolios(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setProducerPortfolios([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, role]);

  const averageRating = profileReviews.length
    ? parseFloat(
        (
          profileReviews.reduce((a, b) => a + b.rating, 0) /
          profileReviews.length
        ).toFixed(1),
      )
    : 0;
  const userReviews = profileReviews;
  const getReviewerDisplay = (review: Review) => {
    const fromCatalogProducer = producers.find((p) => p.userId === review.reviewerId);
    const fromCatalogClient = clients.find((c) => c.userId === review.reviewerId);
    const row: any = fromCatalogProducer || fromCatalogClient;
    const catalogName = row
      ? (row.name ||
          row.user?.displayName ||
          `${(row.firstName ?? "").trim()} ${(row.lastName ?? "").trim()}`.trim()).trim()
      : "";
    const catalogAvatar = row
      ? (row.profileImageUrl || row.user?.profileImageUrl || "").trim() || undefined
      : undefined;
    const apiName = (review.reviewerDisplayName ?? "").trim();
    const apiAvatar =
      typeof review.reviewerProfileImageUrl === "string" &&
      review.reviewerProfileImageUrl.trim()
        ? review.reviewerProfileImageUrl.trim()
        : undefined;
    const name = apiName || catalogName || t("review.reviewerFallback");
    return { name, avatarUrl: apiAvatar ?? catalogAvatar };
  };

  // For Producers Only
  const activeOffers = role === "PRODUCER" && id ? getProducerOffers(id) : [];
  const producerPublishedPortfolios =
    role === "PRODUCER" ? producerPortfolios : [];

  const getPortfolioMedia = (item: any): Array<{ type: "image" | "video"; url: string }> => {
    const images = Array.isArray(item?.imageUrls)
      ? item.imageUrls
          .filter((u: unknown) => typeof u === "string" && u.trim())
          .map((u: string) => ({ type: "image" as const, url: u }))
      : [];
    const video =
      typeof item?.videoUrl === "string" && item.videoUrl.trim()
        ? [{ type: "video" as const, url: item.videoUrl.trim() }]
        : [];
    return [...images, ...video];
  };

  const openPortfolioMedia = useMemo(
    () => (openPortfolio ? getPortfolioMedia(openPortfolio) : []),
    [openPortfolio],
  );

  useEffect(() => {
    if (role !== "PRODUCER" || producerPortfolios.length === 0) return;
    const timer = setInterval(() => {
      setPortfolioSlideIdx((prev) => {
        const next: Record<string, number> = { ...prev };
        producerPortfolios.forEach((item: any) => {
          const mediaCount = getPortfolioMedia(item).length;
          if (mediaCount <= 1) return;
          const current = next[item.id] ?? 0;
          next[item.id] = (current + 1) % mediaCount;
        });
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [role, producerPortfolios]);

  // Only claim "not found" once the catalog refresh AND the direct by-id lookup
  // have both settled — otherwise a slow network reads as a missing user.
  if (!profileData && (pageLoading || !profileLookupSettled)) {
    return <PublicProfileSkeleton />;
  }

  if (!profileData) {
    return <div className="p-8 text-center">{t('profile.notFound')}</div>;
  }

  const isVerified =
    role === "PRODUCER" && profileData.status === ProducerStatus.VALIDATED;

  // Display Name Logic
  const displayName =
    role === "PRODUCER" && profileData.type === "BUSINESS"
      ? profileData.name
      : `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() ||
        profileData.name;

  // Location Logic
  const location =
    profileData.locations && profileData.locations.length > 0
      ? `${profileData.locations[0].city}, ${profileData.locations[0].region}`
      : "Location not set";

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title={
          role === "PRODUCER"
            ? `${displayName} — Agricultural Producer Africa`
            : `${displayName} — AgriMarket Client`
        }
        description={
          role === "PRODUCER"
            ? `Buy farm products from ${displayName}, a verified agricultural producer on AgriMarket Connect — Africa's trusted farming marketplace.`
            : `${displayName} on AgriMarket Connect — Africa's trusted agricultural marketplace.`
        }
        url={role === "PRODUCER" ? `/profile/producer/${id}` : `/profile/client/${id}`}
        locale={language}
        imageUrl={profileData.profileImageUrl}
        schema={
          role === "PRODUCER"
            ? buildProducerProfileSchema({
                name: displayName,
                path: `/profile/producer/${id}`,
                imageUrl: profileData.profileImageUrl,
              })
            : undefined
        }
      />
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-4 sm:mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back
      </button>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
            <div className="flex items-center min-w-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-2 ring-gray-100 bg-white flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                {profileData.profileImageUrl ? (
                  <img
                    src={profileData.profileImageUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-300" />
                )}
              </div>
              <div className="ml-4 min-w-0">
                <div className="min-w-0">
                  <h1
                    className={`text-2xl sm:text-3xl font-bold text-gray-900 ${displayNameTruncateClass} sm:line-clamp-2 sm:whitespace-normal`}
                    title={displayName}
                  >
                    {displayName}
                  </h1>
                  {isVerified && (
                    <span
                      className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      title={t('profile.verifiedProducer')}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center text-gray-600 text-sm mt-1 min-w-0">
                  <MapPin className="w-4 h-4 mr-1 shrink-0" />
                  <span className={displayNameTruncateClass} title={location}>{location}</span>
                </div>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="flex flex-col sm:items-end gap-2">
              {profileData.userId && profileData.userId !== user?.id ? (
                <ReportBlockControl
                  targetType="USER"
                  targetId={profileData.userId}
                  blockUserIdValue={profileData.userId}
                />
              ) : null}
              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">
                <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                <span className="text-xl font-bold text-yellow-700">
                  {averageRating}
                </span>
                <span className="text-xs text-yellow-600 ml-1">
                  ({userReviews.length} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-8">
            {/* Left Column: Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3">About</h3>

                {role === "PRODUCER" && profileData.type === "BUSINESS" && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 block uppercase">
                      Business Sector
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* Show only the producer's real, current categories:
                          de-aliased, de-duplicated and filtered to selectable
                          marketplace categories so stale/legacy/duplicate values
                          don't render as extra chips. */}
                      {canonicalizeCategoryList(profileData.productionTypes).map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profileData.type === "INDIVIDUAL" && profileData.gender && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 block uppercase">
                      Gender
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {profileData.gender}
                    </span>
                  </div>
                )}

                {role === "PRODUCER" && (
                  <div>
                    <span className="text-xs text-gray-500 block uppercase">
                      Description
                    </span>
                    <p
                      className="text-sm text-gray-700 mt-1 break-words whitespace-pre-wrap"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {profileData.description || "No description provided."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Producer Offers */}
              {role === "PRODUCER" && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-primary-600" /> Active
                    Offers ({activeOffers.length})
                  </h3>
                  {activeOffers.length === 0 ? (
                    <p className="text-gray-500 italic">
                      No active offers at the moment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {activeOffers.slice(0, 4).map((offer) => (
                        <div
                          key={offer.id}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row sm:items-center cursor-pointer"
                          onClick={() => navigate(`/offer/${offer.id}`)}
                        >
                          {/* Stacks on mobile so two cards per row stay legible;
                              the wide layout is unchanged from sm: up. */}
                          <div className="h-24 w-full sm:h-12 sm:w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 mb-2 sm:mb-0 sm:mr-3">
                            <img
                              src={offer.imageUrl}
                              className={offerImageInBox}
                              alt={offer.title}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {offer.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {formatXaf(offer.price)} / {unitLabel(t, offer.unit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Producer Portfolio */}
              {role === "PRODUCER" && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-primary-600" />{" "}
                    Portfolio ({producerPublishedPortfolios.length})
                  </h3>
                  {producerPublishedPortfolios.length === 0 ? (
                    <p className="text-gray-500 italic">
                      No portfolio items published yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {producerPublishedPortfolios.slice(0, 4).map((item) => {
                        const media = getPortfolioMedia(item);
                        const currentIdx = Math.min(
                          portfolioSlideIdx[item.id] ?? 0,
                          Math.max(media.length - 1, 0),
                        );
                        const current = media[currentIdx];
                        return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-3 bg-white cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setOpenPortfolio(item);
                            setOpenPortfolioMediaIdx(currentIdx);
                          }}
                        >
                          {current ? (
                            <div className="mb-3 relative flex h-32 w-full items-center justify-center overflow-hidden rounded bg-gray-100">
                              {current.type === "video" ? (
                                <>
                                  <video
                                    src={current.url}
                                    className="h-full w-full object-cover"
                                    muted
                                    playsInline
                                  />
                                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                    <PlayCircle className="h-10 w-10 text-white drop-shadow" />
                                  </div>
                                </>
                              ) : (
                                <img
                                  src={current.url}
                                  alt={item.title}
                                  className={offerImageHero}
                                />
                              )}
                              {media.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  {currentIdx + 1}/{media.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <p className="font-semibold text-gray-900 line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" /> Reviews &
                  Notes
                </h3>
                {userReviews.length === 0 ? (
                  <p className="text-gray-500 italic">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {userReviews.map((review) => {
                      const reviewer = getReviewerDisplay(review);
                      const reviewerInitial = reviewer.name.charAt(0).toUpperCase();
                      return (
                      <div
                        key={review.id}
                        className="border-b border-gray-100 pb-4"
                      >
                        <div className="flex items-center justify-between mb-1 gap-3">
                          <div className="flex items-center min-w-0">
                            {reviewer.avatarUrl ? (
                              <img
                                src={reviewer.avatarUrl}
                                alt=""
                                className="h-8 w-8 rounded-full object-cover mr-2 shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center mr-2 shrink-0">
                                {reviewerInitial}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 truncate mr-3">
                              {reviewer.name}
                            </span>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {openPortfolio && (
        <div className="fixed inset-0 z-50 bg-black/75 p-4 sm:p-6" role="dialog" aria-modal="true">
          <div className="max-w-4xl h-full mx-auto bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{openPortfolio.title}</h4>
                <p className="text-xs text-gray-500 truncate">{openPortfolio.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPortfolio(null)}
                className="text-gray-500 hover:text-gray-800 ml-3"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-4 flex flex-col">
              <div className="relative flex-1 min-h-[240px] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                {openPortfolioMedia.length > 0 ? (
                  openPortfolioMedia[openPortfolioMediaIdx]?.type === "video" ? (
                    <video
                      src={openPortfolioMedia[openPortfolioMediaIdx]?.url}
                      className="h-full w-full object-contain bg-black"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={openPortfolioMedia[openPortfolioMediaIdx]?.url}
                      alt={openPortfolio.title}
                      className="h-full w-full object-contain"
                    />
                  )
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}

                {openPortfolioMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPortfolioMediaIdx((i) =>
                          i === 0 ? openPortfolioMedia.length - 1 : i - 1,
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenPortfolioMediaIdx((i) => (i + 1) % openPortfolioMedia.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full p-1.5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-2 right-2 bg-black/65 text-white text-xs px-2 py-0.5 rounded">
                      {openPortfolioMediaIdx + 1}/{openPortfolioMedia.length}
                    </span>
                  </>
                )}
              </div>

              {openPortfolioMedia.length > 1 && (
                <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto">
                  {openPortfolioMedia.map((m, idx) => (
                    <button
                      type="button"
                      key={`${m.url}-${idx}`}
                      onClick={() => setOpenPortfolioMediaIdx(idx)}
                      className={`h-16 rounded overflow-hidden border ${idx === openPortfolioMediaIdx ? "border-primary-500 ring-1 ring-primary-300" : "border-gray-200"}`}
                    >
                      {m.type === "video" ? (
                        <div className="h-full w-full bg-gray-900 text-white flex items-center justify-center">
                          <PlayCircle className="h-6 w-6" />
                        </div>
                      ) : (
                        <img src={m.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
