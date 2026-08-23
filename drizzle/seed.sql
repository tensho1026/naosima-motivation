INSERT OR IGNORE INTO app_settings (
  id, migration_target_date, journey_started_at, birth_date,
  virtual_journey_distance, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000001', '2030-04-01', '2026-08-23', NULL,
  1000, unixepoch(), unixepoch()
);

INSERT OR IGNORE INTO finance_settings (
  id, current_savings, target_savings, monthly_saving_target, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000002', 620000, 2000000, 50000,
  unixepoch(), unixepoch()
);

INSERT OR IGNORE INTO migration_conditions
  (id, title, description, category, completed, required, weight, target_value,
   current_value, unit, created_at, updated_at)
VALUES
  ('10000000-0000-4000-8000-000000000001', '貯金200万円', '移住後の生活防衛資金', 'MONEY', 0, 1, 5, 2000000, 620000, '円', unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000002', 'フルリモート勤務', '場所に縛られず働ける状態', 'WORK', 0, 1, 5, NULL, NULL, NULL, unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000003', 'Go Level 4', '実務で使えるバックエンド力', 'SKILL', 0, 1, 4, 4, 2, 'Level', unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000004', '月間生活費を把握', '島での暮らしを具体化する', 'LIFESTYLE', 1, 1, 3, NULL, NULL, NULL, unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000005', '直島へ長期滞在', '生活者の視点で島を知る', 'NAOSHIMA', 0, 1, 4, 30, 7, '日', unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000006', '島で知り合いを作る', '移住後のつながりを育てる', 'CONNECTION', 0, 0, 2, 3, 1, '人', unixepoch(), unixepoch());

INSERT OR IGNORE INTO skills
  (id, name, category, level, target_level, xp, status, created_at, updated_at)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'Go', 'Backend', 2, 4, 180, 'LEARNING', unixepoch(), unixepoch()),
  ('20000000-0000-4000-8000-000000000002', 'TypeScript', 'Frontend', 3, 4, 420, 'LEARNING', unixepoch(), unixepoch()),
  ('20000000-0000-4000-8000-000000000003', 'Database', 'Backend', 2, 4, 160, 'LEARNING', unixepoch(), unixepoch());

INSERT OR IGNORE INTO missions
  (id, title, description, type, category, xp, impact_score, estimated_minutes,
   minimum_title, minimum_minutes, weekly_priority, skill_id, scheduled_date,
   completed, created_at, updated_at)
VALUES
  ('30000000-0000-4000-8000-000000000001', 'Goを30分勉強', 'API実装を1つ進める', 'DAILY', 'SKILL', 10, 3, 30, 'Goを5分だけ開く', 5, 1, '20000000-0000-4000-8000-000000000001', date('now'), 0, unixepoch(), unixepoch()),
  ('30000000-0000-4000-8000-000000000002', 'GitHubにコミット', '今日の学びを形に残す', 'DAILY', 'WORK', 10, 2, 20, 'READMEを1行直す', 5, 0, NULL, date('now'), 0, unixepoch(), unixepoch()),
  ('30000000-0000-4000-8000-000000000003', '移住資金に1,000円追加', NULL, 'DAILY', 'MONEY', 5, 2, 5, '家計を1項目確認', 5, 0, NULL, date('now'), 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO roadmap_items
  (id, title, description, target_date, status, category, sort_order, created_at, updated_at)
VALUES
  ('40000000-0000-4000-8000-000000000001', '新卒エンジニア', '実務経験を始める', '2026-04-01', 'IN_PROGRESS', 'WORK', 1, unixepoch(), unixepoch()),
  ('40000000-0000-4000-8000-000000000002', '実務経験1年', NULL, '2027-04-01', 'NOT_STARTED', 'WORK', 2, unixepoch(), unixepoch()),
  ('40000000-0000-4000-8000-000000000003', '副収入を始める', NULL, '2028-04-01', 'NOT_STARTED', 'MONEY', 3, unixepoch(), unixepoch()),
  ('40000000-0000-4000-8000-000000000004', 'フルリモートと移住資金達成', NULL, '2029-12-31', 'NOT_STARTED', 'WORK', 4, unixepoch(), unixepoch()),
  ('40000000-0000-4000-8000-000000000005', '直島移住', NULL, '2030-04-01', 'NOT_STARTED', 'NAOSHIMA', 5, unixepoch(), unixepoch());

INSERT OR IGNORE INTO naoshima_reasons (id, content, created_at, updated_at)
VALUES ('50000000-0000-4000-8000-000000000001', '仕事が終わったあとに海を歩ける生活がしたい', unixepoch(), unixepoch());

INSERT OR IGNORE INTO bucket_items
  (id, title, kind, description, completed, created_at, updated_at)
VALUES
  ('51000000-0000-4000-8000-000000000001', '朝の海を見る', 'BUCKET', NULL, 0, unixepoch(), unixepoch()),
  ('51000000-0000-4000-8000-000000000002', '島を自転車で一周する', 'BUCKET', NULL, 0, unixepoch(), unixepoch()),
  ('51000000-0000-4000-8000-000000000003', '休日に写真を撮る', 'BUCKET', NULL, 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO migration_scenarios
  (id, name, description, monthly_income, monthly_expenses, monthly_saving,
   current_savings, target_savings, created_at, updated_at)
VALUES
  ('60000000-0000-4000-8000-000000000001', '会社員フルリモート', '安定収入を維持して移住', 320000, 190000, 80000, 620000, 2000000, unixepoch(), unixepoch()),
  ('60000000-0000-4000-8000-000000000002', '副業を育てて移住', '給与と副業の二本柱', 370000, 205000, 110000, 620000, 2000000, unixepoch(), unixepoch());

INSERT OR IGNORE INTO ideal_day_items
  (id, time, title, sort_order, created_at, updated_at)
VALUES
  ('70000000-0000-4000-8000-000000000001', '07:00', '起床', 1, unixepoch(), unixepoch()),
  ('70000000-0000-4000-8000-000000000002', '07:30', '海沿いを散歩', 2, unixepoch(), unixepoch()),
  ('70000000-0000-4000-8000-000000000003', '09:00', 'リモートワーク', 3, unixepoch(), unixepoch()),
  ('70000000-0000-4000-8000-000000000004', '18:30', '島を散歩', 4, unixepoch(), unixepoch()),
  ('70000000-0000-4000-8000-000000000005', '20:00', 'ピアノ・写真・個人開発', 5, unixepoch(), unixepoch());

INSERT OR IGNORE INTO achievement_definitions
  (id, code, title, description, kind, threshold, icon)
VALUES
  ('80000000-0000-4000-8000-000000000001', 'FIRST_STEP', 'FIRST STEP', '初めてMissionを完了', 'MISSION_COUNT', 1, 'Footprints'),
  ('80000000-0000-4000-8000-000000000002', 'XP_100', '100 XP', '総XPが100に到達', 'TOTAL_XP', 100, 'Sparkles'),
  ('80000000-0000-4000-8000-000000000003', 'SAVER', 'SAVER', '貯金10万円を達成', 'SAVINGS', 100000, 'PiggyBank'),
  ('80000000-0000-4000-8000-000000000004', 'JOURNEY_25', 'JOURNEY 25%', '仮想距離250kmに到達', 'JOURNEY', 250, 'MapPin'),
  ('80000000-0000-4000-8000-000000000005', 'ISLANDER', 'ISLANDER', '移住可能度100%を達成', 'READINESS', 100, 'Waves');

INSERT OR IGNORE INTO bingo_items
  (id, title, completed, sort_order, created_at, updated_at)
VALUES
  ('90000000-0000-4000-8000-000000000001', '朝日を見る', 0, 1, unixepoch(), unixepoch()),
  ('90000000-0000-4000-8000-000000000002', '本村を散歩', 0, 2, unixepoch(), unixepoch()),
  ('90000000-0000-4000-8000-000000000003', '雨の日の直島', 0, 3, unixepoch(), unixepoch()),
  ('90000000-0000-4000-8000-000000000004', '猫に会う', 0, 4, unixepoch(), unixepoch()),
  ('90000000-0000-4000-8000-000000000005', '夕日を見る', 0, 5, unixepoch(), unixepoch()),
  ('90000000-0000-4000-8000-000000000006', '一人で1週間滞在', 0, 6, unixepoch(), unixepoch());

INSERT OR IGNORE INTO island_quests
  (id, title, description, random_eligible, completed, created_at, updated_at)
VALUES
  ('91000000-0000-4000-8000-000000000001', '宮浦から本村まで歩く', '景色の変化を楽しみながら歩く', 1, 0, unixepoch(), unixepoch()),
  ('91000000-0000-4000-8000-000000000002', '知らない道を1本歩く', '安全に注意しながら新しい景色を探す', 1, 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO lifestyle_comparisons
  (id, label, current_value, naoshima_value, sort_order, created_at, updated_at)
VALUES
  ('92000000-0000-4000-8000-000000000001', '通勤', '40分', '0分', 1, unixepoch(), unixepoch()),
  ('92000000-0000-4000-8000-000000000002', '海まで', '60分', '5分', 2, unixepoch(), unixepoch()),
  ('92000000-0000-4000-8000-000000000003', '家賃', '80,000円', '60,000円', 3, unixepoch(), unixepoch());
