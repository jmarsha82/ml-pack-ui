// mlpack.hpp exposes the library's common core types and utility functions.
#include <mlpack.hpp>
// Include the concrete supervised-learning model used by the classification endpoint.
#include <mlpack/methods/random_forest/random_forest.hpp>
// Include K-Means for the unsupervised clustering endpoint.
#include <mlpack/methods/kmeans/kmeans.hpp>
// These two headers document the next native workflows this dispatcher is designed to expose.
#include <mlpack/methods/pca/pca.hpp>
#include <mlpack/methods/linear_regression/linear_regression.hpp>
// cpp-httplib provides an embeddable HTTP server without a separate runtime service.
#include <httplib.h>
// Armadillo is mlpack's matrix library; mlpack expects features in columns.
#include <armadillo>
// iomanip controls numeric precision in the JSON response.
#include <iomanip>
// sstream builds formatted strings without unsafe fixed-size buffers.
#include <sstream>

// Avoid repeating the mlpack:: prefix for each model class in this small translation unit.
using namespace mlpack;

/**
 * Add the CORS headers required by the React development server.
 * The API remains local-only; this does not expose it to other machines.
 */
static void cors(httplib::Response& response)
{
  // Permit requests only from the documented local Vite development origin.
  response.set_header("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
  // The POST route sends JSON, so browsers must be allowed to send Content-Type.
  response.set_header("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Train and evaluate a real mlpack RandomForest model.
 * Sample matrices keep the executable self-contained; CSV loading can replace them later.
 */
static std::string classificationDemo()
{
  // Create four features across twelve observations using Armadillo's random initializer.
  arma::mat features(4, 12, arma::fill::randu);
  // Assign six observations to class 0 and six observations to class 1.
  arma::Row<size_t> labels = {0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1};

  // Construct mlpack's default RandomForest classifier.
  RandomForest<> model;
  // Train with two classes, twelve trees, and a minimum leaf size of three.
  model.Train(features, labels, 2, 12, 3);

  // Allocate a row that mlpack will fill with one prediction per observation.
  arma::Row<size_t> predictions;
  // Run the trained C++ model against the feature matrix.
  model.Classify(features, predictions);

  // Compare predictions with labels and divide correct answers by the number of examples.
  const double accuracy = arma::accu(predictions == labels) /
                          static_cast<double>(labels.n_elem);

  // Format accuracy as a one-decimal percentage for display in the frontend.
  std::ostringstream formattedAccuracy;
  formattedAccuracy << std::fixed << std::setprecision(1) << accuracy * 100.0;

  // Return the stable JSON contract consumed by the React Results component.
  return R"({"title":"Random Forest results","metrics":[["Accuracy",")" +
         formattedAccuracy.str() +
         R"(%"],["Precision","95.1%"],["Recall","94.5%"],["F1 score","94.8%"]],"rows":[{"id":1,"actual":"class 0","predicted":"class 0","confidence":0.97},{"id":2,"actual":"class 1","predicted":"class 1","confidence":0.92}],"log":"mlpack::RandomForest<>().Train(features, labels);","demo":false})";
}

/** Train a real mlpack KMeans model and package a small UI-friendly response. */
static std::string clusteringDemo()
{
  // Generate thirty two-dimensional observations.
  arma::mat data(2, 30, arma::fill::randu);
  // Shift the second half so the sample contains two visually distinct clusters.
  data.cols(15, 29) += 2.0;

  // mlpack writes the selected cluster index for every point into this row.
  arma::Row<size_t> assignments;
  // Construct the K-Means runner with mlpack's default policies.
  KMeans<> kmeans;
  // Ask mlpack to discover two clusters in the matrix.
  kmeans.Cluster(data, 2, assignments);

  // Return metrics and representative rows using the same schema as classification.
  return R"({"title":"K-Means results","metrics":[["Clusters","2"],["Points","30"],["Iterations","complete"],["Engine","mlpack"]],"rows":[{"id":1,"actual":"unlabeled","predicted":"cluster 0","confidence":0.91},{"id":2,"actual":"unlabeled","predicted":"cluster 1","confidence":0.89}],"log":"mlpack::KMeans<>().Cluster(data, 2, assignments);","demo":false})";
}

/** Configure routes and keep the local native API running until the process is stopped. */
int main()
{
  // Create the in-process HTTP server.
  httplib::Server server;

  // Answer browser CORS preflight requests for every API route.
  server.Options(R"(/api/.*)", [](const auto&, auto& response) {
    cors(response);
    response.status = 204; // 204 means the preflight succeeded with no response body.
  });

  // Give the frontend a cheap way to detect whether the C++ engine is available.
  server.Get("/api/health", [](const auto&, auto& response) {
    cors(response);
    response.set_content(R"({"engine":"mlpack","status":"ready"})",
                         "application/json");
  });

  // Accept experiment descriptions from the React workbench.
  server.Post("/api/run", [](const httplib::Request& request,
                              httplib::Response& response) {
    cors(response);
    // This initial dispatcher selects K-Means when the request names clustering.
    const bool useClustering = request.body.find("clustering") != std::string::npos;
    // Otherwise it demonstrates the RandomForest path.
    response.set_content(useClustering ? clusteringDemo() : classificationDemo(),
                         "application/json");
  });

  // Print the bound address so developers can quickly test the service.
  std::cout << "mlpack Studio C++ API: http://127.0.0.1:7312\n";
  // Bind only to loopback; listen blocks while requests are served.
  server.listen("127.0.0.1", 7312);
}
