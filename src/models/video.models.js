import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String, // ⁡⁢⁢⁣𝗰𝗹𝗼𝘂𝗱𝗶𝗻𝗮𝗿𝘆 𝘂𝗿𝗹⁡
      required: true,
    },
    thumbnail: {
      type: String, // ⁡⁢⁢⁣𝗰𝗹𝗼𝘂𝗱𝗶𝗻𝗮𝗿𝘆 𝘂𝗿𝗹⁡
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema);
