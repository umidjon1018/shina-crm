"""i18n kalitlarini birlashtirish — 71 guruh, ~292 kalit tejash."""
import re, os, glob, sys
sys.stdout.reconfigure(encoding='utf-8')

UZ_FILE = r'C:\Users\Umidjon\Desktop\shina_crm\src\i18n\uz.js'
RU_FILE = r'C:\Users\Umidjon\Desktop\shina_crm\src\i18n\ru.js'
SRC_DIR = r'C:\Users\Umidjon\Desktop\shina_crm\src'

# ── Yangi umumiy kalitlar (uz, ru) ─────────────────────────────────────────────
NEW_KEYS = {
    'col_date':         ("Sana",             "Дата"),
    'col_category':     ("Kategoriya",        "Категория"),
    'col_amount':       ("Summa",             "Сумма"),
    'col_customer':     ("Mijoz",             "Клиент"),
    'col_employee':     ("Xodim",             "Сотрудник"),
    'col_product':      ("Tovar",             "Товар"),
    'filter_all':       ("Barchasi",          "Все"),
    'col_note':         ("Izoh",              "Примечание"),
    'col_status':       ("Holat",             "Статус"),
    'col_net_profit':   ("Sof foyda",         "Чистая прибыль"),
    'col_product_name': ("Tovar nomi",        "Название товара"),
    'col_phone':        ("Telefon",           "Телефон"),
    'col_type':         ("Tur",               "Тип"),
    'col_name':         ("Nomi",              "Название"),
    'col_source':       ("Manba",             "Источник"),
    'col_exchange':     ("Almashtirish",      "Обмен"),
    'col_in_stock':     ("Omborda",           "На складе"),
    'col_uzs':          ("UZS",               "UZS"),
    'col_total_sum':    ("Summasi",           "Сумма"),
    'col_sold_date':    ("Sotilgan sana",     "Дата продажи"),
    'col_debt':         ("Qarz",              "Долг"),
    'col_rate':         ("Kurs",              "Курс"),
    'col_discount':     ("Chegirma",          "Скидка"),
    'col_done':         ("Bajarildi",         "Выполнено"),
    'col_supplier':     ("Yetkazib beruvchi", "Поставщик"),
    'col_gross_profit': ("Yalpi foyda",       "Валовая прибыль"),
    'col_time':         ("Vaqt",              "Время"),
    'col_reason':       ("Sabab",             "Причина"),
    'col_debt_usd':     ("Qarz (USD)",        "Долг (USD)"),
    'col_margin':       ("Marja",             "Маржа"),
    'col_address':      ("Manzil",            "Адрес"),
    'col_country':      ("Mamlakat",          "Страна"),
    'col_new_product':  ("Yangi tovar",       "Новый товар"),
    'col_tier':         ("Daraja",            "Уровень"),
}

# ── Eski kalit → kanonik kalit xaritasi ─────────────────────────────────────
# Format: 'eski_kalit': 'kanonik_kalit'
# Kanonik kalit yangi yoki mavjud bo'lishi mumkin.
# Mavjud kanonik kalitlar o'chirilmaydi (o'zi saqlanib qoladi).

KEY_MAP = {
    # Sana → col_date (mavjud kalitlarning barchasi o'chiriladi, col_date yangi)
    'cust_inst_th_date':              'col_date',
    'exp_cap_col_date':               'col_date',
    'exp_cap_form_date':              'col_date',
    'exp_col_date':                   'col_date',
    'exp_sup_col_date':               'col_date',
    'inc_pay_col_date':               'col_date',
    'inc_supp_detail_th_date':        'col_date',
    'inc_th_date':                    'col_date',
    'rep_bu_col_date':                'col_date',
    'rep_col_date':                   'col_date',
    'rep_emp_modal_cancelled_col_date': 'col_date',
    'rep_fin_col_date':               'col_date',
    'sl_hist_th_date':                'col_date',
    'sl_inst_modal_th_date':          'col_date',
    'sl_profit_th_date':              'col_date',

    # Kategoriya → col_category
    'exp_col_category':               'col_category',
    'exp_form_category':              'col_category',
    'inc_th_category':                'col_category',
    'mgmt_col_category':              'col_category',
    'mgmt_field_category':            'col_category',
    'mgmt_promo_field_category':      'col_category',
    'mgmt_promo_type_category':       'col_category',
    'rep_bu_col_category':            'col_category',
    'rep_col_category':               'col_category',
    'rep_fin_col_category':           'col_category',
    'sl_hist_th_category':            'col_category',
    'sl_inst_th_category':            'col_category',
    'wh_th_category':                 'col_category',

    # Summa → col_amount
    'cust_inst_th_amount':            'col_amount',
    'exp_cap_col_amount':             'col_amount',
    'exp_col_amount':                 'col_amount',
    'exp_form_amount':                'col_amount',
    'inc_contract_sum_label':         'col_amount',
    'rep_col_amount':                 'col_amount',
    'rep_emp_metric_amount':          'col_amount',
    'rep_emp_modal_cancelled_col_amount': 'col_amount',
    'rep_fin_col_amount':             'col_amount',
    'rep_profit_amount_col':          'col_amount',
    'sl_rh_th_amount':                'col_amount',
    'sl_sis_th_amount':               'col_amount',

    # Mijoz → col_customer
    'ai_booking_client':              'col_customer',
    'cust_th_customer':               'col_customer',
    'rep_bu_col_customer':            'col_customer',
    'rep_col_customer':               'col_customer',
    'rep_emp_modal_cancelled_col_customer': 'col_customer',
    'rep_fin_col_customer':           'col_customer',
    'sl_hist_th_customer':            'col_customer',
    'sl_inst_modal_th_customer':      'col_customer',
    'sl_inst_th_customer':            'col_customer',
    'sl_ns_label_customer':           'col_customer',
    'sl_profit_th_customer':          'col_customer',
    'sl_rh_th_customer':              'col_customer',

    # Xodim → col_employee
    'adm_audit_col_employee':         'col_employee',
    'cust_inst_th_employee':          'col_employee',
    'exp_form_employee':              'col_employee',
    'mgmt_emp_label':                 'col_employee',
    'rep_bu_col_employee':            'col_employee',
    'rep_col_employee':               'col_employee',
    'rep_fin_col_employee':           'col_employee',
    'sl_hist_th_employee':            'col_employee',
    'sl_inst_th_employee':            'col_employee',
    'sl_profit_th_employee':          'col_employee',
    'sl_rh_th_employee':              'col_employee',

    # Tovar → col_product
    'cust_th_items':                  'col_product',
    'exp_sup_col_product':            'col_product',
    'inc_supp_detail_th_product':     'col_product',
    'inc_th_product':                 'col_product',
    'mgmt_col_product':               'col_product',
    'rep_col_product':                'col_product',
    'rep_emp_modal_cancelled_col_product': 'col_product',
    'rep_fin_col_product':            'col_product',
    'sl_inst_modal_th_product':       'col_product',
    'sl_ps_th_product':               'col_product',
    'wh_th_product':                  'col_product',

    # Barchasi → filter_all
    'cat_all':                        'filter_all',
    'dash_all':                       'filter_all',
    'exp_all':                        'filter_all',
    'exp_cap_all':                    'filter_all',
    'mgmt_filter_all':                'filter_all',
    'mgmt_promo_all_shops':           'filter_all',
    'rep_all':                        'filter_all',
    'season_all':                     'filter_all',
    'sl_all':                         'filter_all',
    'sl_inst_modal_all_months':       'filter_all',
    'sl_us_scrap_all':                'filter_all',

    # Izoh → col_note
    'exp_cap_col_note':               'col_note',
    'exp_cap_form_note':              'col_note',
    'exp_col_note':                   'col_note',
    'exp_form_note':                  'col_note',
    'exp_sup_col_note':               'col_note',
    'inc_note_label':                 'col_note',
    'inc_notes_label':                'col_note',
    'inc_pay_col_note':               'col_note',
    'mgmt_field_notes':               'col_note',
    'rep_bu_col_note':                'col_note',

    # Holat → col_status (Holati gruppi ham shu yerga)
    'adm_emp_col_status':             'col_status',
    'inc_th_status':                  'col_status',
    'mgmt_col_condition':             'col_status',
    'mgmt_promo_col_status':          'col_status',
    'rep_bu_col_status':              'col_status',
    'rep_col_status':                 'col_status',
    'rep_fin_col_status':             'col_status',
    'rep_profit_status_col':          'col_status',
    'wh_th_status':                   'col_status',
    # Holati grupp (3 ta)
    'emp_status':                     'col_status',
    'mgmt_col_status':                'col_status',
    'sl_inst_th_status':              'col_status',

    # Sof foyda → col_net_profit
    'ai_kpi_net_profit':              'col_net_profit',
    'emp_stat_profit':                'col_net_profit',
    'rep_chart_net':                  'col_net_profit',
    'rep_fin_net_profit':             'col_net_profit',
    'rep_pft_net_profit':             'col_net_profit',
    'rep_profit_net_col':             'col_net_profit',
    'rep_profit_net_label':           'col_net_profit',
    'rep_profit_net_total_label':     'col_net_profit',

    # Tovar nomi → col_product_name
    'mgmt_field_name':                'col_product_name',
    'rep_fin_col_product_name':       'col_product_name',
    'sl_hist_th_product':             'col_product_name',
    'sl_inst_th_product':             'col_product_name',
    'sl_ns_tradein_name_ph':          'col_product_name',
    'sl_profit_th_product':           'col_product_name',
    'wh_in_prod_name':                'col_product_name',

    # Telefon → col_phone
    'adm_emp_col_phone':              'col_phone',
    'adm_field_phone':                'col_phone',
    'cust_field_phone':               'col_phone',
    'cust_th_phone':                  'col_phone',
    'inc_supplier_phone':             'col_phone',
    'rep_emp_modal_profile_phone':    'col_phone',
    'rep_fin_col_phone':              'col_phone',

    # Naqd → pay_cash (mavjud)
    'rep_pay_cash':                   'pay_cash',
    'sl_hist_pay_cash':               'pay_cash',
    'sl_ns_pay_cash':                 'pay_cash',
    'sl_profit_pay_cash':             'pay_cash',
    'sl_ret_pay_cash':                'pay_cash',
    'sl_success_pay_cash':            'pay_cash',

    # Muddatli → pay_installment (mavjud)
    'rep_bu_status_pending':          'pay_installment',
    'rep_pay_installment':            'pay_installment',
    'sl_hist_pay_installment':        'pay_installment',
    'sl_hist_status_pending':         'pay_installment',
    'sl_ns_pay_installment':          'pay_installment',
    'sl_profit_pay_installment':      'pay_installment',

    # Karta → pay_card (mavjud)
    'rep_pay_card':                   'pay_card',
    'sl_hist_pay_card':               'pay_card',
    'sl_ns_pay_card':                 'pay_card',
    'sl_profit_pay_card':             'pay_card',
    'sl_ret_pay_card':                'pay_card',
    'sl_success_pay_card':            'pay_card',

    # Tasdiqlash → confirm (mavjud)
    'adm_delete_approve':             'confirm',
    'adm_dev_approve':                'confirm',
    'ai_approve':                     'confirm',
    'selfie_confirm':                 'confirm',
    'sl_cancel_btn_confirm':          'confirm',

    # Sotuvchi → role_seller (mavjud)
    'adm_role_seller':                'role_seller',
    'mgmt_role_seller':               'role_seller',
    'rep_col_seller':                 'role_seller',
    'rep_emp_col_seller':             'role_seller',
    'role_employee':                  'role_seller',

    # ✅ Faol → mgmt_status_active (mavjud)
    'emp_status_active':              'mgmt_status_active',
    'inc_contract_active':            'mgmt_status_active',
    'inc_supp_detail_active':         'mgmt_status_active',
    'mgmt_src_active':                'mgmt_status_active',

    # Yopish → close (mavjud)
    'ai_close':                       'close',
    'emp_close_btn':                  'close',
    'emp_close_pass':                 'close',
    'sl_success_close':               'close',

    # Xarajatlar → expenses (mavjud)
    'adm_perm_expenses':              'expenses',
    'exp_page_title':                 'expenses',
    'perm_expenses':                  'expenses',
    'rep_pft_expenses':               'expenses',

    # Tur → col_type
    'exp_cap_col_type':               'col_type',
    'exp_col_type':                   'col_type',
    'mgmt_promo_col_type':            'col_type',
    'mgmt_promo_field_type':          'col_type',

    # Sotilgan → sold (mavjud)
    'cust_used_status_sold':          'sold',
    'inc_inv_sold':                   'sold',
    'sl_ps_th_sold':                  'sold',
    'wh_th_sold':                     'sold',

    # Saqlash → save (mavjud)
    'mgmt_title_save':                'save',
    'profile_save':                   'save',
    'shop_pick_confirm':              'save',
    'sl_ret_save':                    'save',

    # Omborda → col_in_stock
    'cust_used_status_in_stock':      'col_in_stock',
    'dash_in_stock':                  'col_in_stock',
    'inc_inv_stock':                  'col_in_stock',
    'wh_bu_in_stock_label':           'col_in_stock',
    'wh_modal_in_stock':              'col_in_stock',

    # Ombor → warehouse (mavjud)
    'adm_perm_warehouse':             'warehouse',
    'ai_tab_inventory':               'warehouse',
    'perm_warehouse':                 'warehouse',
    'wh_title':                       'warehouse',

    # Nomi → col_name
    'inc_supp_name':                  'col_name',
    'inc_supplier_name':              'col_name',
    'mgmt_col_name':                  'col_name',
    'rep_bu_col_name':                'col_name',
    'rep_profit_name_col':            'col_name',

    # Manba → col_source
    'exp_cap_col_source':             'col_source',
    'mgmt_sources_col_name':          'col_source',
    'rep_col_source':                 'col_source',
    'rep_fin_col_source':             'col_source',
    'sl_hist_th_source':              'col_source',

    # Almashtirish → col_exchange
    'rep_emp_modal_cancelled_reason_exchange': 'col_exchange',
    'rep_exchange':                   'col_exchange',
    'sl_cancel_refund_exchange':      'col_exchange',
    'sl_ret_exchange_btn':            'col_exchange',
    'sl_rh_type_exchange':            'col_exchange',

    # Yangi tovar → col_new_product
    'mgmt_add_product':               'col_new_product',
    'rep_fin_col_new_inv':            'col_new_product',
    'sl_rh_th_new':                   'col_new_product',
    'wh_in_new_btn':                  'col_new_product',

    # Yangi mijoz → cust_new (mavjud)
    'cust_add_title':                 'cust_new',
    'cust_merge_new_customer':        'cust_new',
    'sl_cust_modal_title':            'cust_new',

    # Usul → inc_pay_method (mavjud)
    'inc_method_label':               'inc_pay_method',
    'inc_pay_col_method':             'inc_pay_method',
    'inc_supp_detail_th_method':      'inc_pay_method',

    # UZS → col_uzs
    'exp_cap_col_uzs':                'col_uzs',
    'exp_col_uzs':                    'col_uzs',
    'inc_pay_col_uzs':                'col_uzs',
    'inc_supp_detail_th_uzs':         'col_uzs',

    # Tugagan → stock_empty (mavjud)
    'rep_status_out':                 'stock_empty',
    'rep_stock_out':                  'stock_empty',
    'wh_stat_empty':                  'stock_empty',

    # Tovarlar → mgmt_tab_products (mavjud)
    'mgmt_stat_products':             'mgmt_tab_products',
    'perm_management_products':       'mgmt_tab_products',
    'rep_bu_col_items':               'mgmt_tab_products',

    # Summasi → col_total_sum
    'rep_bu_col_total':               'col_total_sum',
    'rep_fin_col_total_sum':          'col_total_sum',
    'sl_inst_th_total':               'col_total_sum',
    'sl_ns_tradein_price_ph':         'col_total_sum',

    # Sozlamalar → mgmt_tab_settings (mavjud)
    'adm_tab_settings':               'mgmt_tab_settings',
    'mgmt_section_settings':          'mgmt_tab_settings',
    'perm_management_settings':       'mgmt_tab_settings',

    # Sotuvlar → perm_sales (mavjud)
    'rep_col_sales_word':             'perm_sales',
    'rep_emp_col_sales':              'perm_sales',
    'rep_emp_modal_profile_sales_count': 'perm_sales',

    # Sotilgan sana → col_sold_date
    'rep_bu_col_sold_date':           'col_sold_date',
    'rep_fin_col_sold_date':          'col_sold_date',
    'sl_inst_th_date':                'col_sold_date',
    'wh_bu_sold_date':                'col_sold_date',

    # Qisman → inc_filter_partial (mavjud)
    'cust_inst_partial':              'inc_filter_partial',
    'rep_fin_status_partial':         'inc_filter_partial',
    'sl_inst_status_partial':         'inc_filter_partial',

    # Qarz → col_debt
    'cust_inst_debt_label':           'col_debt',
    'cust_th_debt':                   'col_debt',
    'rep_col_debt':                   'col_debt',

    # Parol → password (mavjud)
    'adm_field_password':             'password',
    'emp_form_password':              'password',
    'emp_password':                   'password',

    # Ogohlantirish → warning (mavjud)
    'ai_rec_warning':                 'warning',
    'ai_type_alert':                  'warning',
    'rep_fin_col_warning':            'warning',

    # Kurs → col_rate
    'inc_pay_col_rate':               'col_rate',
    'inc_supp_detail_th_rate':        'col_rate',
    'inc_th_rate':                    'col_rate',

    # Kapital harakati → exp_tab_capital (mavjud)
    'exp_cap_form_add_title':         'exp_tab_capital',
    'perm_expenses_capital':          'exp_tab_capital',
    'rep_fin_capital_movements':      'exp_tab_capital',

    # Hisobotlar → reports (mavjud)
    'adm_perm_reports':               'reports',
    'perm_reports':                   'reports',
    'rep_title':                      'reports',

    # Daraja → col_tier
    'cust_level':                     'col_tier',
    'cust_th_level':                  'col_tier',
    'mgmt_loyalty_col_tier':          'col_tier',
    'rep_col_tier':                   'col_tier',

    # Chegirma → col_discount
    'mgmt_promo_col_discount':        'col_discount',
    'rep_col_discount':               'col_discount',
    'sl_hist_th_discount':            'col_discount',
    'sl_us_discount_label':           'col_discount',

    # Bajarildi → col_done
    'rep_col_completed':              'col_done',
    'rep_col_done':                   'col_done',
    'sl_hist_status_completed':       'col_done',
    'sl_profit_status_done':          'col_done',

    # 🔒 Bloklangan → emp_status_blocked (mavjud)
    'adm_emp_status_blocked':         'emp_status_blocked',

    # {{count}} ta sotuv → dash_sales_count (mavjud)
    'rep_bu_card_revenue_sub':        'dash_sales_count',
    'rep_bu_modal_sales_count':       'dash_sales_count',

    # Yetkazib beruvchilar → suppliers (mavjud)
    'inc_tab_suppliers':              'suppliers',
    'perm_income_suppliers':          'suppliers',

    # Yetkazib beruvchi → col_supplier
    'inc_th_supplier':                'col_supplier',
    'rep_fin_col_supplier':           'col_supplier',
    'wh_in_supplier':                 'col_supplier',

    # Yalpi foyda → col_gross_profit
    'rep_pft_gross_profit':           'col_gross_profit',
    'rep_profit_gross_col':           'col_gross_profit',
    'rep_profit_gross_total_label':   'col_gross_profit',

    # Xatolik yuz berdi → exp_err_generic (mavjud)
    'profile_err_generic':            'exp_err_generic',
    'wh_in_err':                      'exp_err_generic',

    # Vaqt → col_time
    'adm_audit_col_time':             'col_time',
    'adm_delete_req_time':            'col_time',
    'cust_inst_th_time':              'col_time',

    # Tahrirlash → edit (mavjud)
    'inc_supplier_modal_edit':        'edit',
    'mgmt_title_edit':                'edit',

    # Sotuv vaqt tahlili → rep_hour_analysis (mavjud)
    'rep_modal_hour_title':           'rep_hour_analysis',
    'rep_time_title':                 'rep_hour_analysis',

    # Shartnoma raqami → inc_contract_number (mavjud)
    'inc_supp_contract_no':           'inc_contract_number',
    'sl_ns_contract_label':           'inc_contract_number',

    # Sabab → col_reason
    'rep_col_reason':                 'col_reason',
    'rep_emp_modal_cancelled_col_reason': 'col_reason',
    'sl_rh_th_reason':                'col_reason',

    # Rol → adm_field_role (mavjud)
    'adm_emp_col_role':               'adm_field_role',
    'emp_form_role':                  'adm_field_role',

    # Qarz (USD) → col_debt_usd
    'inc_preview_debt':               'col_debt_usd',
    'inc_supp_detail_th_debt':        'col_debt_usd',
    'rep_col_debt_usd':               'col_debt_usd',

    # Oy: → exp_month_label (mavjud)
    'emp_filter_month':               'exp_month_label',
    'sl_inst_month_label':            'exp_month_label',

    # Omborchi → role_storekeeper (mavjud)
    'adm_role_storekeeper':           'role_storekeeper',
    'mgmt_role_storekeeper':          'role_storekeeper',

    # Narx mos kelmadi → sl_cancel_r_price (mavjud)
    'rep_cancel_narx':                'sl_cancel_r_price',
    'rep_emp_modal_cancelled_reason_price': 'sl_cancel_r_price',

    # Mijoz manbalari → rep_sources_title (mavjud)
    'rep_cust_sources_title':         'rep_sources_title',
    'rep_sources':                    'rep_sources_title',

    # Marja → col_margin
    'rep_bu_col_margin':              'col_margin',
    'rep_col_margin':                 'col_margin',
    'rep_fin_legend_margin':          'col_margin',

    # Manzil → col_address
    'inc_supp_address':               'col_address',
    'inc_supplier_address':           'col_address',
    'mgmt_shop_field_address':        'col_address',

    # Mamlakat → col_country
    'mgmt_field_country':             'col_country',
    'wh_modal_country':               'col_country',
    'wh_th_country':                  'col_country',

    # Jami qarz → inc_stat_debt (mavjud)
    'inc_supplier_debt':              'inc_stat_debt',
    'rep_total_debt':                 'inc_stat_debt',
}

print(f"KEY_MAP: {len(KEY_MAP)} eski kalit → kanonik")
print(f"NEW_KEYS: {len(NEW_KEYS)} yangi umumiy kalit")

# ── i18n fayllarni yangilash ────────────────────────────────────────────────────
def load_raw(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def update_i18n(path, new_keys_local):
    content = load_raw(path)
    keys_to_remove = set(KEY_MAP.keys())

    # Yangi SHARED blok
    shared_lines = ['  // ── SHARED ─────────────────────────────────────────────']
    for k, (uz_v, ru_v) in NEW_KEYS.items():
        v = uz_v if 'uz' in path else ru_v
        shared_lines.append(f"  {k}: '{v}',")
    shared_lines.append('')
    shared_block = '\n'.join(shared_lines) + '\n'

    # Har bir satrni tekshir
    lines = content.splitlines(keepends=True)
    new_lines = []
    inserted = False
    for line in lines:
        m = re.match(r"  ([a-zA-Z0-9_]+): '", line)
        if m:
            key = m.group(1)
            if key in keys_to_remove:
                # Bu kalitni o'tkaz (o'chirish)
                continue
            # Birinchi oddiy kalit oldiga SHARED blok qo'sh
            if not inserted:
                new_lines.append(shared_block)
                inserted = True
        new_lines.append(line)

    result = ''.join(new_lines)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(result)
    removed = sum(1 for l in lines if re.match(r"  ([a-zA-Z0-9_]+): '", l)
                  and re.match(r"  ([a-zA-Z0-9_]+): '", l).group(1) in keys_to_remove)
    print(f"  {os.path.basename(path)}: {removed} kalit o'chirildi, {len(NEW_KEYS)} yangi qo'shildi")

update_i18n(UZ_FILE, {k: v[0] for k, v in NEW_KEYS.items()})
update_i18n(RU_FILE, {k: v[1] for k, v in NEW_KEYS.items()})

# ── Manba fayllarni yangilash ────────────────────────────────────────────────
src_files = glob.glob(os.path.join(SRC_DIR, '**', '*.jsx'), recursive=True)
src_files += glob.glob(os.path.join(SRC_DIR, '**', '*.js'), recursive=True)
src_files = [f for f in src_files if 'i18n' not in f and 'node_modules' not in f]

total_replacements = 0
changed_files = 0

for fpath in src_files:
    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    original = content
    count = 0
    for old_key, new_key in KEY_MAP.items():
        # t('old_key') yoki t("old_key") formatlarni almashtir
        for q in ["'", '"']:
            pattern = f"t({q}{old_key}{q}"
            replacement = f"t({q}{new_key}{q}"
            if pattern in content:
                n = content.count(pattern)
                content = content.replace(pattern, replacement)
                count += n
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        total_replacements += count
        changed_files += 1
        print(f"  {os.path.relpath(fpath, SRC_DIR)}: {count} almashtirish")

print(f"\nJami: {total_replacements} almashtirish, {changed_files} fayl o'zgartirildi")
print("Tayyor!")
