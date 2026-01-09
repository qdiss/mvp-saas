const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;

async function testVideoParameters(asin: string, marketplace: string = "com") {
  const tests = [
    {
      name: "Standard (videos=true)",
      params: {
        type: "product",
        amazon_domain: `amazon.${marketplace}`,
        asin,
        videos: "true",
      },
    },
    {
      name: "With video_count",
      params: {
        type: "product",
        amazon_domain: `amazon.${marketplace}`,
        asin,
        videos: "true",
        video_count: "10",
      },
    },
    {
      name: "With related_video_count",
      params: {
        type: "product",
        amazon_domain: `amazon.${marketplace}`,
        asin,
        videos: "true",
        related_video_count: "10",
      },
    },
    {
      name: "Only video_count (no videos flag)",
      params: {
        type: "product",
        amazon_domain: `amazon.${marketplace}`,
        asin,
        video_count: "10",
      },
    },
    {
      name: "Videos as separate request type",
      params: {
        type: "videos",
        amazon_domain: `amazon.${marketplace}`,
        asin,
      },
    },
  ];

  console.log(`\n🔍 Testing video parameters for ASIN: ${asin}\n`);

  for (const test of tests) {
    console.log(`\n━━━ Test: ${test.name} ━━━`);

    try {
      const url = new URL("https://api.rainforestapi.com/request");
      url.searchParams.append("api_key", RAINFOREST_API_KEY!);

      Object.entries(test.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      console.log("Request params:", test.params);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.product) {
        console.log("✅ Product found");
        console.log("   Has videos field:", !!data.product.videos);
        console.log("   Videos type:", typeof data.product.videos);
        console.log("   Videos count:", data.product.videos?.length || 0);
        console.log("   Has has_videos flag:", data.product.has_videos);
        console.log(
          "   First video:",
          data.product.videos?.[0]?.title || "N/A"
        );
      } else if (data.videos) {
        console.log("✅ Videos found at root level");
        console.log("   Videos count:", data.videos?.length || 0);
        console.log("   First video:", data.videos?.[0]?.title || "N/A");
      } else {
        console.log("❌ No video data found");
        console.log("   Response keys:", Object.keys(data));
      }
    } catch (error: any) {
      console.log("❌ Error:", error.message);
    }

    // Wait 1 second between requests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n✅ Investigation complete\n");
}

// If running as API endpoint
export async function GET(request: Request) {
  const url = new URL(request.url);
  const asin = url.searchParams.get("asin");
  const marketplace = url.searchParams.get("marketplace") || "com";

  if (!asin) {
    return Response.json({ error: "ASIN required" }, { status: 400 });
  }

  // Capture console output
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args) => {
    logs.push(args.join(" "));
    originalLog(...args);
  };

  await testVideoParameters(asin, marketplace);

  console.log = originalLog;

  return Response.json({
    success: true,
    asin,
    logs,
  });
}

// If running as Node script
if (require.main === module) {
  const asin = process.argv[2] || "B00IJ0ALYS";
  testVideoParameters(asin);
}
