from pyspark.sql import SparkSession
from surprise import Reader
from surprise import Dataset
from surprise import KNNBasic
from collections import defaultdict
from pyspark.sql.functions import *
import json

# Read data
spark = SparkSession.builder.appName("KNN rec sys").getOrCreate()
product_rating = spark.read.csv("Ratings.csv", header=True, inferSchema=True)
df_product = spark.read.csv('Products.csv', header = True)

# Assuming you have a DataFrame named df and you want to rename column 'oldColumnName' to 'newColumnName'
df_product = df_product.withColumnRenamed('id', 'productId')
merged_df = product_rating.join(df_product, 'productId', 'inner')
    
merged_df.select(
    [count(when(col(c).isNull(), c)).alias(c) for c in merged_df.columns]
    ).show()

df_train, df_test = merged_df.randomSplit([0.7, 0.3], seed = 96)
df_train_pandas = df_train.toPandas()
df_test_pandas = df_test.toPandas()


reader = Reader(rating_scale=(1, 5))


data_train = Dataset.load_from_df(df_train_pandas[['userId', 'productId', 'rating']], reader)
data_test = Dataset.load_from_df(df_test_pandas[['userId', 'productId', 'rating']], reader)

trainset = data_train.build_full_trainset()
testset = data_test.build_full_trainset().build_testset()

algo = KNNBasic(sim_options={'user_based': True})
algo.fit(trainset)
knn_predictions = algo.test(testset)

def get_top_n(predictions, n):
    top_n = defaultdict(list)
    for uid, iid, true_r, est, _ in predictions:
        top_n[uid].append((iid, est))
        
    for uid, user_ratings in top_n.items():
        user_ratings.sort(key=lambda x: x[1], reverse=True)
        top_n[uid] = user_ratings[:n]
    return top_n

top_n = get_top_n(knn_predictions, n=10)
def get_top_n_product_titles(user_id, top_n, df):
    recommended_product_ids = [item[0] for item in top_n.get(user_id, [])]
    product_titles = []

    for product_id in recommended_product_ids:
        product_row = df.filter(df.productId == product_id).first()
        if product_row is not None:
            product_titles.append(product_row['title'])
        else:
            product_titles.append(None)

    return product_titles
# Assuming `user_id` is the ID of the user you're interested in
user_id = '6536796b581e4933cfa90de6'
recommended_titles = get_top_n_product_titles(user_id, top_n, merged_df)

# for idx, title in enumerate(recommended_titles, start=1):
#     if title is not None:
#         print(f"Recommendation {idx}: {title}")
#     else:
#         print(f"Recommendation {idx}: No product found")
def recommender(recommended_titles):
    return json.dumps(recommended_titles)
recommender
