############################
#  前準備1.Indexの作成
############################
# Lookup host_list を作成
DELETE /host_list/
PUT /host_list/
{
  "mappings":{
    "properties": {
      "ip_addr":{
        "type": "keyword"
      },
      "host_name":{
        "type": "keyword"
      },
      "user_name":{
        "type": "keyword"
      }
    }
  }
}

# Lookup host_list にデータ追加
POST /host_list/_doc 
{
  "ip_addr":"192.168.3.2",
  "host_name":"host_32",
  "user_name":"takada"
}
POST /host_list/_doc 
{
  "ip_addr":"192.168.3.3",
  "host_name":"host_33",
  "user_name":"yamada"
}
POST /host_list/_doc 
{
  "ip_addr":"192.168.3.4",
  "host_name":"host_34",
  "user_name":"sato"
}
POST /host_list/_doc 
{
  "ip_addr":"192.168.3.5",
  "host_name":"host_35",
  "user_name":"nakase"
}

# 監視ログIndex(trail_log)を作成する
DELETE /trail_log/
PUT /trail_log/
{
  "mappings": {
    "properties": {
      "trail_datetime" : {
        "type" : "date"
      },
      "srcip": {
        "type" : "keyword"
      },
      "dstip":{
        "type": "keyword"
      },
      "action":{
        "type": "keyword"
      },
      "comment":{
        "type": "text"
      }
    }
  }
}

############################
#  前準備2.Pipelineの作成
############################
# Lookup の参照ポリシーを作成
DELETE /_enrich/policy/host_list_policy
PUT /_enrich/policy/host_list_policy
{
  "match": {
    "indices": "host_list",
    "match_field": "ip_addr",
    "enrich_fields": ["host_name" ,"user_name"]
  }
}

# 参照ポリシーを適用し、enrich indexを作成する
POST /_enrich/policy/host_list_policy/_execute

# 監視ログIndexパイプラインを作成する
DELETE /_ingest/pipeline/trail_log_pipeline
PUT /_ingest/pipeline/trail_log_pipeline
{
  "processors": [
    {
      "enrich": {
        "policy_name": "host_list_policy",
        "field": "srcip",
        "target_field": "src_host",
        "description": "host_list join by srcip",
        "max_matches": 1
      }
    },
    {
      "enrich": {
        "policy_name": "host_list_policy",
        "field": "dstip",
        "target_field": "dst_host",
        "description": "host_list join by dstip",
        "max_matches": 1
      }
    }
  ]
}

############################
#  実行.データ追加・参照
############################
# 監視ログIndexにデータを追加する
POST /trail_log/_doc/?pipeline=trail_log_pipeline
{
  "srcip":"192.168.3.3",
  "dstip":"192.168.3.4",
  "action":"BLOCK",
  "comment":"injeqtion Attack"
}

# 監視ログIndexのデータを確認する
GET /trail_log/_search
