import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../services/storeContext";
import { useTranslation } from "../../services/i18nContext";
import { ProducerStatus, Review } from "../../types";
import {
  User,
  MapPin,
  ShieldCheck,
  Star,
  ArrowLeft,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "../../services/apiService";
import { API_ENDPOINTS } from "../../client-api/endpoints";
import { PublicProfileSkeleton } from "../../components/skeletons/PublicProfileSkeleton";
import { offerImageHero, offerImageInBox } from "../../utils/offerImageDisplay";

function mapReviewRow(r: any): Review {
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
    isInitialCatalogLoading,
  } = useStore();
  const { t } = useTranslation();

  const [profileData, setProfileData] = useState<any>(null);
  const [profileReviews, setProfileReviews] = useState<Review[]>([]);
  const [producerPortfolios, setProducerPortfolios] = useState<any[]>([]);

  useEffect(() => {
    if (role === "PRODUCER") {
      const producer = producers.find((p) => p.id === id);
      setProfileData(producer);
    } else {
      const client = clients.find((c) => c.id === id);
      setProfileData(client);
    }
  }, [id, role, producers, clients]);

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

  if (isInitialCatalogLoading && !profileData) {
    return <PublicProfileSkeleton />;
  }

  if (!profileData) {
    return <div className="p-8 text-center">User not found</div>;
  }

  const averageRating = profileReviews.length
    ? parseFloat(
        (
          profileReviews.reduce((a, b) => a + b.rating, 0) /
          profileReviews.length
        ).toFixed(1),
      )
    : 0;
  const userReviews = profileReviews;

  // For Producers Only
  const activeOffers = role === "PRODUCER" && id ? getProducerOffers(id) : [];
  const producerPublishedPortfolios =
    role === "PRODUCER" ? producerPortfolios : [];
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="h-5 w-5 mr-2" /> Back
      </button>

      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Header / Cover */}
        <div className="bg-primary-600 h-32 sm:h-48"></div>

        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 sm:-mt-16 mb-6">
            <div className="flex items-end">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white bg-white flex items-center justify-center overflow-hidden shadow-md">
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
              <div className="ml-4 mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {displayName}
                  {isVerified && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      title="Verified Producer"
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" /> Verified
                    </span>
                  )}
                </h1>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1" /> {location}
                </div>
              </div>
            </div>

            {/* Rating Badge */}
            <div className="flex flex-col items-end">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
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
                      {profileData.productionTypes?.map((type: string) => (
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
                    <p className="text-sm text-gray-700 mt-1">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeOffers.slice(0, 4).map((offer) => (
                        <div
                          key={offer.id}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white flex items-center cursor-pointer"
                          onClick={() => navigate(`/offer/${offer.id}`)}
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100 mr-3">
                            <img
                              src={offer.imageUrl}
                              className={offerImageInBox}
                              alt={offer.title}
                            />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium text-gray-900 truncate">
                              {offer.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {offer.price} XAF / {t(`unit.${offer.unit}`)}
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
                      {producerPublishedPortfolios.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-3 bg-white"
                        >
                          {item.imageUrls?.[0] ? (
                            <div className="mb-3 flex h-32 w-full items-center justify-center overflow-hidden rounded bg-gray-100">
                              <img
                                src={item.imageUrls[0]}
                                alt={item.title}
                                className={offerImageHero}
                              />
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
                      ))}
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
                    {userReviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-gray-100 pb-4"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                            <span className="ml-2 text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
