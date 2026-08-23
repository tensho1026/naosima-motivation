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
  ('10000000-0000-4000-8000-000000000006', '島で知り合いを作る', '移住後のつながりを育てる', 'CONNECTION', 0, 0, 2, 3, 1, '人', unixepoch(), unixepoch()),
  ('10000000-0000-4000-8000-000000000007', '副収入月5万円', '給与だけに依存しない状態を作る', 'WORK', 0, 1, 4, 50000, 20000, '円/月', unixepoch(), unixepoch());

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
  ('80000000-0000-4000-8000-000000000005', 'ISLANDER', 'ISLANDER', '移住可能度100%を達成', 'READINESS', 100, 'Waves'),
  ('80000000-0000-4000-8000-000000000006', 'XP_1000', '1000 XP', '総XPが1000に到達', 'TOTAL_XP', 1000, 'Sparkles'),
  ('80000000-0000-4000-8000-000000000007', 'HALF_MILLION', 'HALF MILLION', '貯金50万円を達成', 'SAVINGS', 500000, 'PiggyBank'),
  ('80000000-0000-4000-8000-000000000008', 'MILLION', 'MILLION', '貯金100万円を達成', 'SAVINGS', 1000000, 'PiggyBank'),
  ('80000000-0000-4000-8000-000000000009', 'REMOTE_READY', 'REMOTE READY', 'Remote Work条件を達成', 'REMOTE_WORK', 1, 'Laptop'),
  ('80000000-0000-4000-8000-000000000010', 'SIDE_HUSTLE', 'SIDE HUSTLE', '副収入を初めて記録', 'SIDE_INCOME', 1, 'WalletCards'),
  ('80000000-0000-4000-8000-000000000011', '100_DAYS', '100 DAYS', '100日以上行動', 'ACTIVITY_DAYS', 100, 'CalendarDays'),
  ('80000000-0000-4000-8000-000000000012', 'ISLAND_VISITOR', 'ISLAND VISITOR', '直島Visitを登録', 'VISIT_COUNT', 1, 'ShipWheel'),
  ('80000000-0000-4000-8000-000000000013', 'JOURNEY_50', 'JOURNEY 50%', '仮想距離500kmに到達', 'JOURNEY', 500, 'MapPin'),
  ('80000000-0000-4000-8000-000000000014', 'JOURNEY_75', 'JOURNEY 75%', '仮想距離750kmに到達', 'JOURNEY', 750, 'MapPin');

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

INSERT OR IGNORE INTO career_conditions
  (id, title, completed, target_value, current_value, unit, created_at, updated_at)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'フルリモートで働ける', 0, NULL, NULL, NULL, unixepoch(), unixepoch()),
  ('a0000000-0000-4000-8000-000000000002', '個人収入を月5万円にする', 0, 50000, 20000, '円/月', unixepoch(), unixepoch());

INSERT OR IGNORE INTO income_sources
  (id, name, type, monthly_amount, active, created_at, updated_at)
VALUES
  ('a1000000-0000-4000-8000-000000000001', '給与', 'SALARY', 280000, 1, unixepoch(), unixepoch()),
  ('a1000000-0000-4000-8000-000000000002', '個人開発', 'PRODUCT', 20000, 1, unixepoch(), unixepoch());

INSERT OR IGNORE INTO side_income_goals
  (id, level, monthly_amount, completed, created_at, updated_at)
VALUES
  ('a2000000-0000-4000-8000-000000000001', 1, 10000, 1, unixepoch(), unixepoch()),
  ('a2000000-0000-4000-8000-000000000002', 2, 30000, 0, unixepoch(), unixepoch()),
  ('a2000000-0000-4000-8000-000000000003', 3, 50000, 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO life_simulations
  (id, name, salary, side_income, rent, food, utilities, internet, transport,
   entertainment, other, planned_saving, created_at, updated_at)
VALUES
  ('a3000000-0000-4000-8000-000000000001', '直島生活 基本プラン', 300000,
   50000, 60000, 40000, 15000, 5000, 18000, 20000, 12000, 80000,
   unixepoch(), unixepoch());

INSERT OR IGNORE INTO saving_transactions
  (id, amount, type, note, date, created_at)
VALUES
  ('a4000000-0000-4000-8000-000000000001', 45000, 'DEPOSIT', '6月の移住資金', '2026-06-30', unixepoch()),
  ('a4000000-0000-4000-8000-000000000002', 50000, 'DEPOSIT', '7月の移住資金', '2026-07-31', unixepoch()),
  ('a4000000-0000-4000-8000-000000000003', 55000, 'DEPOSIT', '8月の移住資金', '2026-08-23', unixepoch());

INSERT OR IGNORE INTO ideal_week_items
  (id, weekday, title, sort_order, created_at, updated_at)
VALUES
  ('a5000000-0000-4000-8000-000000000001', 1, '午前は集中してリモートワーク', 1, unixepoch(), unixepoch()),
  ('a5000000-0000-4000-8000-000000000002', 3, '夕方に海辺を散歩', 1, unixepoch(), unixepoch()),
  ('a5000000-0000-4000-8000-000000000003', 6, '写真と個人開発の日', 1, unixepoch(), unixepoch());

INSERT OR IGNORE INTO visits
  (id, start_date, end_date, title, description, rating, created_at, updated_at)
VALUES
  ('a6000000-0000-4000-8000-000000000001', '2026-08-10', '2026-08-12',
   '2026 Summer', '朝の宮浦と本村を歩いた。', 5, unixepoch(), unixepoch());

INSERT OR IGNORE INTO visit_places (id, visit_id, place_name)
VALUES
  ('a6100000-0000-4000-8000-000000000001', 'a6000000-0000-4000-8000-000000000001', '宮浦港'),
  ('a6100000-0000-4000-8000-000000000002', 'a6000000-0000-4000-8000-000000000001', '本村');

INSERT OR IGNORE INTO calendar_events
  (id, title, date, kind, description, created_at, updated_at)
VALUES
  ('a7000000-0000-4000-8000-000000000001', '秋の直島訪問', '2026-10-10', 'NEXT_VISIT', '季節の変化を記録する', unixepoch(), unixepoch());

INSERT OR IGNORE INTO origin_stories
  (id, first_visit_date, decided_at, title, story, photo_id, created_at, updated_at)
VALUES
  ('a8000000-0000-4000-8000-000000000001', '2024-05-03', '2026-08-23',
   '海を歩いて暮らす未来', '初めて島を歩いた日に、観光ではなく生活としてここへ戻りたいと思った。', NULL,
   unixepoch(), unixepoch());

INSERT OR IGNORE INTO season_goals
  (id, title, category, start_date, end_date, completed, created_at, updated_at)
VALUES
  ('a9000000-0000-4000-8000-000000000001', '2026秋: Go強化', 'SKILL', '2026-09-01', '2026-11-30', 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO focus_settings
  (id, category, note, start_date, end_date, created_at, updated_at)
VALUES
  ('aa000000-0000-4000-8000-000000000001', 'SKILL', 'バックエンド力を移住可能な仕事につなげる', '2026-08-01', '2026-10-31', unixepoch(), unixepoch());

INSERT OR IGNORE INTO future_profiles
  (id, target_year, residence, work_style, work_days_per_week, monthly_income,
   hobbies, created_at, updated_at)
VALUES
  ('ab000000-0000-4000-8000-000000000001', 2030, '直島', 'フルリモート + 個人開発', 4,
   400000, '["写真","ピアノ","個人開発"]', unixepoch(), unixepoch());

INSERT OR IGNORE INTO milestone_events
  (id, title, description, date, category, automatic, created_at, updated_at)
VALUES
  ('ac000000-0000-4000-8000-000000000001', '移住目標を設定', '直島移住を本気の目標にした', '2026-08-23', 'NAOSHIMA', 0, unixepoch(), unixepoch());

INSERT OR IGNORE INTO action_logs
  (id, type, title, description, category, amount, source_id, occurred_at)
VALUES
  ('ad000000-0000-4000-8000-000000000001', 'OTHER', '移住目標を設定', '2030年4月を目標日にした', 'NAOSHIMA', NULL, NULL, unixepoch('2026-08-20')),
  ('ad000000-0000-4000-8000-000000000002', 'OTHER', '直島での生活費を試算', NULL, 'LIFESTYLE', NULL, NULL, unixepoch('2026-08-21')),
  ('ad000000-0000-4000-8000-000000000003', 'OTHER', 'Goの学習計画を作成', NULL, 'SKILL', NULL, NULL, unixepoch('2026-08-23'));

INSERT OR IGNORE INTO monthly_snapshots
  (id, month, readiness, savings, total_xp, completed_missions, skill_levels, created_at)
VALUES
  ('ae000000-0000-4000-8000-000000000001', '2026-07', 18, 565000, 80, 5, '{"Go":1,"TypeScript":2}', unixepoch()),
  ('ae000000-0000-4000-8000-000000000002', '2026-08', 24, 620000, 140, 9, '{"Go":2,"TypeScript":3}', unixepoch());
