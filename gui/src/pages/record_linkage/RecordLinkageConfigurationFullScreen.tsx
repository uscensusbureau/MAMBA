import {useState, useEffect} from "react";
import {
    Space, Table, Input, Card, Button, Typography, Form, Col, Divider, Row, Collapse,
    Badge, message, Modal, Dropdown, Cascader, theme, Drawer, Select, Checkbox, Tooltip,
    Switch, Steps, Upload, Flex, InputNumber
} from 'antd';
import YAML from 'js-yaml';
import {saveAs} from 'file-saver';

const {Paragraph} = Typography;
const {Dragger} = Upload;
import {
    DeleteFilled, CloseOutlined, PlusOutlined
} from '@ant-design/icons';
import ReactJson from 'react-json-view';
import {useRecoilValue, useRecoilState} from "recoil";
import {framesAtom} from 'src/state/frame/framesAtom';
import {selectedFrameAtom} from 'src/state/frame/selectedFrameAtom';
import {themeAtom} from 'src/state/theme/themeAtom';
import Requests from 'src/services/Requests';
import debounce from 'lodash/debounce';

const {TextArea} = Input;

const downloadFile = (data, filename, type) => {
    const file = new Blob([data], {type: type});
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    console.log(a)
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
};


const RecordLinkageConfigurationFullScreen = (props) => {
    const themePreset = useRecoilValue(themeAtom);
    const {token} = theme.useToken();
    const contentStyle = {
        // lineHeight: '260px',
        // textAlign: 'center',
        color: token.colorTextTertiary,
        backgroundColor: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorder}`,
        marginTop: 16,
        padding: `8px 8px`,
        overflowY: 'auto',
        maxHeight: '70vh'
    };

    const [defaultLayout, setDefaultLayout] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const matchType = Form.useWatch('match_type', form)
    const [activePanels, setActivePanels] = useState([]);
    const [blockInfoExpanded, setBlockInfoExpanded] = useState(true);
    const [variableTypesExpanded, setVariableTypesExpanded] = useState(true);

    const [jsonConfigModalOpen, setJsonConfigModalOpen] = useState(false);
    const [currentPayload, setCurrentPayload] = useState({});

    const [data1, setData1] = useState('');
    const [data1Display, setData1Display] = useState('');
    const [data2, setData2] = useState('');
    const [data2disabled, setData2disabled] = useState(false);
    const [clericalReviewThresholdsCount, setClericalReviewThresholdsCount] = useState(0)
    const [usePrediction, setUsePrediction] = useState(false)
    const [useClericalReviewCandidates, setUseClericalReviewCandidates] = useState(false)
    const fuzzyOptions = [
        {value: 'feb.bag_distance', active: false, label: "Bag Distance", description: "Bag Distance"},
        {
            value: 'feb.charhistogram',
            active: false,
            label: "Character Histogram",
            description: "Cosine similarity of character histograms"
        },
        {
            value: 'feb.editdist',
            active: false,
            label: "Edit (Lev.) Distance",
            description: "Edit-distance (or Levenshtein distance)"
        },
        {value: 'feb.jaro', active: false, label: "Jaro", description: "Jaro Comparator"},
        {
            value: 'feb.winkler',
            active: false,
            label: "Jaro-Winkler",
            description: "Winkler modification to Jaro Comparator"
        },
        {
            value: 'feb.lcs2',
            active: false,
            label: "Longest Common Substring (2)",
            description: "(Repeated) longest common substring, improves results for swapped words, min 2 characters"
        },
        {
            value: 'feb.lcs3',
            active: false,
            label: "Longest Common Substring (3)",
            description: "(Repeated) longest common substring, improves results for swapped words, min 3 characters"
        },
        {
            value: 'feb.ontolcs2',
            active: false,
            label: "Ontology-aligned LCS (2)",
            description: "Ontology alignment string comparison based on longest common substring, Hamacher product and Winkler heuristics. (min 2 characters)"
        },
        {
            value: 'feb.ontolcs3',
            active: false,
            label: "Ontology-aligned LCS (3)",
            description: "Ontology alignment string comparison based on longest common substring, Hamacher product and Winkler heuristics. (min 3 characters)"
        },
        {value: 'feb.editex', active: false, label: "Editex", description: "Phonetic aware edit-distance."},
        {value: 'feb.posqgram3', active: false, label: "Positional Qgram (3)", description: "Positional Qgram."},
        {value: 'feb.qgram2', active: false, label: "Qgram (2, Bigram)", description: "Bigram Comparison"},
        {
            value: 'feb.qgram3',
            active: false,
            label: "Qgram (3, Trigram)",
            description: "Qgram-based (min three characters)"
        },
        {
            value: 'feb.seqmatch',
            active: false,
            label: "seqmatch",
            description: "Sequential match from Python's difflib module."
        },
        {value: 'feb.swdist', active: false, label: "Smith-Waterman distance", description: "Smith-Waterman distance."},
        {
            value: 'feb.twoleveljaro',
            active: false,
            label: "Two level Jaro",
            description: "Apply Jaro comparator at word level, with words being compared using a selectable approximate string comparison function"
        },
        {
            value: 'feb.permwinkler',
            active: false,
            label: "Winkler (Permutation)",
            description: "Winkler combined with permutations of words."
        },
        {value: 'feb.sortwinkler', active: true, label: "Winkler (Sorted)", description: "Winkler with sorted words"}
    ]
    const [checkedValues, setCheckedValues] = useState([])
    const [sqlFlavor, setSqlFlavor] = useState('')
    const [existingConfig, setExistingConfig] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const [yamlData, setYamlData] = useState(null);
    const [error, setError] = useState(null);
    const [debouncedValue, setDebouncedValue] = useState(null)
    const [dbCreationMode, setDBCreationMode] = useState('existing')
    const [useRandomForest, setUseRandomForest] = useState(false)
    const [useMambaModels, setUseMambaModels] = useState(false)
    const [useCustomModel, setUseCustomModel] = useState(null)
    const [deduplicationMode, setDeduplicationMode] = useState(false)
    // debouncing the selection for data1 (so typing doesn't mess with what the selection is)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(data1);
        }, 500); // Wait for 500ms after the last input change

        return () => clearTimeout(timeoutId); // Clear timeout if input changes again
    }, [data1]);

    const data1OnChange = (event) => {
        setData1(event.target.value);
        if (deduplicationMode) {
            setData1Display('left')
        } else {
            setData1Display(event.target.value)
        }
    };
    //same for data2
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(data2);
        }, 500); // Wait for 500ms after the last input change

        return () => clearTimeout(timeoutId); // Clear timeout if input changes again
    }, [data2]);
    const data2OnChange = (event) => {
        setData2(event.target.value);
    };

    function handleBlockFilter(target, value){
        console.log(value)
        console.log(target)
    }
    //changing the sql flavor
    const handleSqlChange = (value) => {
        setSqlFlavor(value);
    };
    //change deduplication mode
    const handleDeduplicationChange = (value) => {
        setDeduplicationMode(value)
        if (value === true) {
            setData2('right')
        }
    }
    const handleDBModeChange = (value) => {
        setDBCreationMode(value);
    }
    const handleRandomForestChange = (value) => {
        setUseRandomForest(value);
    }
    const handleMambaModelChange = (value) => {
        setUseMambaModels(value);
    }

    const handleCustomModelChange = (value) => {
        setUseCustomModel(value);
    }
    const handlePredictionChange = (value) => {
        setUsePrediction(value);
    };
    const handleClericalReviewChange = (value) => {
        setUseClericalReviewCandidates(value);
    };

    const handleClericalReviewThresholdsCountChange = (value) => {
        setClericalReviewThresholdsCount(1)
    }
    //handling how we upload files
    const readFileAsync = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                resolve(YAML.load(event.target.result));
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsText(file);
        });
    };

    const handleFileChange = async (event) => {
        setVariableTypesExpanded(true)
        setBlockInfoExpanded(true)
        form.resetFields()
        const file = event.target.files[0];
        if (file) {
            try {
                const config = await readFileAsync(file);
                if (setExistingConfig) {
                    setActivePanels(['batchInformation', 'dbInformation', 'dataSources',
                        'blockingAndVariableInformation', 'modelOutputs', 'model',
                        'debugBlocks']
                    )
                    setData1(config.CONFIG.data1_name)
                    setDeduplicationMode(config.CONFIG.mode === 'deduplication')
                    console.log(deduplicationMode)
                    if (!config.CONFIG.mode) {
                        setData2(config.CONFIG.data2_name)
                    } else {
                        setData1('left')
                        setData2('right')
                    }

                    form.setFieldsValue({
                        /** Project, Batch, and DB Info Begin */
                        projectPath: (config.CONFIG && config.CONFIG.projectPath) ? config.CONFIG.projectPath : '',
                        mode: (config.CONFIG && config.CONFIG.mode === 'deduplication'),
                        ignore_duplicate_ids: !!(config.CONFIG && config.CONFIG.ignore_duplicate_ids),
                        model_only: !!(config.CONFIG && config.CONFIG.model_only),
                        debugmode: !!(config.CONFIG && config.CONFIG.debugmode),
                        database_creation_mode: (config.CONFIG && config.CONFIG.database_creation_mode) ? config.CONFIG.database_creation_mode : null,
                        create_db_chunksize: (config.CONFIG && config.CONFIG.create_db_chunksize) ? config.CONFIG.database_creation_mode : 100000,
                        chatty_logger: (config.CONFIG && config.CONFIG.chatty_logger) ? config.CONFIG.chatty_logger : false,
                        log_file_name: (config.CONFIG && config.CONFIG.log_file_name) ? config.CONFIG.log_file_name : 'mamba_log',
                        numWorkers: (config.CONFIG && config.CONFIG.numWorkers) ? config.CONFIG.numWorkers : 2,
                        imputation_method: (config.CONFIG && config.CONFIG.imputation_method) ? config.CONFIG.imputation_method : 'No Imputation',
                        /** Project and BAtch DB Info End */
                        /**DB Information Start */
                        sql_flavor: (config.CONFIG && config.CONFIG.sql_flavor) ? config.CONFIG.sql_flavor : '',
                        db_name: (config.CONFIG && config.CONFIG.db_name) ? config.CONFIG.db_name : null,
                        db_host: (config.CONFIG && config.CONFIG.db_host) ? config.CONFIG.db_host : null,
                        db_schema: (config.CONFIG && config.CONFIG.db_schema) ? config.CONFIG.db_schema : null,
                        db_user: (config.CONFIG && config.CONFIG.db_user) ? config.CONFIG.db_user : null,
                        db_password_env_var: (config.CONFIG && config.CONFIG.db_password_env_var) ? config.CONFIG.db_password_env_var : null,
                        db_port: (config.CONFIG && config.CONFIG.db_port) ? config.CONFIG.db_port : null,
                        /**DB Information End */
                        /** Data Source Begin */
                        data1: (config.CONFIG && config.CONFIG.data1_name) ? config.CONFIG.data1_name : null,
                        data1CustomSelectionStatement: (config.CONFIG &&
                            config.CONFIG.data1_name &&
                            config.CONFIG.custom_selection_statement) ? config.CONFIG.custom_selection_statement[config.CONFIG.data1_name] : '',
                        data2: (config.CONFIG && config.CONFIG.data2_name) ? config.CONFIG.data2_name : null,
                        data2CustomSelectionStatement: (config.CONFIG &&
                            config.CONFIG.data2_name &&
                            config.CONFIG.custom_selection_statement) ? config.CONFIG.custom_selection_statement[config.CONFIG.data2_name] : '',
                        /** Data Source End */

                        /** Blocking and Variable Information Start */
                        blocks: config.blocks ? config.blocks.map(block => ({
                            order: block.order,
                            block_name: block.block_name,
                            data1BlockVar: config.CONFIG.mode === 'deduplication' ? block['left'] : block[config.CONFIG.data2_name],
                            data2BlockVar: config.CONFIG.mode === 'deduplication' ? block['right'] : block[config.CONFIG.data2_name],
                            variable_filter_info: block['variable_filter_info'] ? [{
                                data1VariableFilter: block.variable_filter_info[config.CONFIG.data1_name],
                                data2VariableFilter: block.variable_filter_info[config.CONFIG.data2_name],
                                match_type: block.variable_filter_info.match_type ?? '',
                                fuzzy_name: block.variable_filter_info.fuzzy_name ?? '',
                                test: block.variable_filter_info.test ?? '',
                                filter_value: block.variable_filter_info.filter_value ?? ''
                            }] : []
                        })) : [],

                        variable_types: config.var_types ? config.var_types.map(type => ({
                            variable_name: type.variable_name,
                            data1TypeVar: config.CONFIG.mode === 'deduplication' ? type['left'] : type[config.CONFIG.data1_name],
                            data2TypeVar: config.CONFIG.mode === 'deduplication' ? type['right'] : type[config.CONFIG.data2_name],
                            match_type: type.match_type ?? '',
                            custom_variable_name: type.custom_variable_name ?? '',
                            custom_kwarg_args: type.custom_variable_kwargs ? Object.keys(type.custom_variable_kwargs).map(argKey => ({
                                kwargname: argKey,
                                kwargvalue: type.custom_variable_kwargs[argKey]
                            })) : [],
                            filter_only: type.filter_only ? [
                                    {
                                        test: type.filter_only['test'],
                                        value: type.filter_only['value'],
                                        fuzzy_name: type.filter_only['fuzzy_name'] ? type.filter_only['fuzzy_name'] : null
                                    }]
                                : []
                        })) : [],
                        /** Blocking and Variable Information End */
                        /** Model Outputs Start */
                        prediction: (config.CONFIG && config.CONFIG.prediction) ? true : false,
                        match_threshold: (config.CONFIG && config.CONFIG.match_threshold) ? config.CONFIG.match_threshold : .5,
                        scoringcriteria: (config.CONFIG && config.CONFIG.scoringcriteria) ? config.CONFIG.scoringcriteria : '',
                        matched_pairs_table_name: (config.CONFIG && config.CONFIG.matched_pairs_table_name) ? config.CONFIG.matched_pairs_table_name : '',

                        clerical_review_candidates: (config.CONFIG && config.CONFIG.clerical_review_candidates) ? true : false,
                        clerical_review_candidates_table_name: (config.CONFIG && config.CONFIG.clerical_review_candidates_table_name) ? config.CONFIG.clerical_review_candidates_table_name : '',
                        clerical_review_thresholds: (config.CONFIG && config.CONFIG.clerical_review_threshold && config.CONFIG.clerical_review_threshold.listed_variable_names) ?
                            config.CONFIG.clerical_review_threshold.listed_variable_names.map(name => ({
                                variable_name: name.variable,
                                value: name.value
                            })) : [],
                        query_logic: (config.CONFIG && config.CONFIG.clerical_review_threshold) ? config.CONFIG.clerical_review_threshold.query_logic : '',
                        /** Model Outputs End */

                        /** The Model Start */
                        use_mamba_models: (config.CONFIG && config.CONFIG.use_mamba_models) ? true : false,
                        /** note that custom model is always the opposite of the mamba models */
                        use_custom_model: (config.CONFIG && config.CONFIG.use_custom_model) ? true : false,
                        custom_model_name: (config.CONFIG && config.CONFIG.custom_model_name) ? config.CONFIG.custom_model_name : '',
                        saved_model: (config.CONFIG && config.CONFIG.saved_model) ? config.CONFIG.saved_model : '',
                        use_ada: (config.CONFIG && config.CONFIG.use_ada) ? true : false,
                        use_rf: (config.CONFIG && config.CONFIG.use_rf) ? true : false,
                        rf_jobs: (config.CONFIG && config.CONFIG.use_rf) ? config.CONFIG.rf_jobs : 1,
                        use_logit: (config.CONFIG && config.CONFIG.use_logit) ? true : false,
                        feature_elimination_mode: (config.CONFIG && config.CONFIG.feature_elimination_mode) ? true : false,
                        training_data_name: (config.CONFIG && config.CONFIG.training_data_name) ? config.CONFIG.training_data_name : '',
                        saved_model_target: (config.CONFIG && config.CONFIG.saved_model_target) ? config.CONFIG.saved_model_target : '',
                        used_fuzzy_metrics: (config.CONFIG && config.CONFIG.used_fuzzy_metrics) ? config.CONFIG.used_fuzzy_metrics : [],
                        /** The Model End */

                        /** Debugging Blocks Start */
                        debug_blocks: (config.CONFIG && config.CONFIG.debug_blocks) ?
                            config.CONFIG.debug_blocks.map(debugBlock => ({
                                blockOrder: debugBlock.block_order ?? '',
                                blockVariableInformation: debugBlock.block_variable_information ? debugBlock.block_variable_information.map(info => ({
                                    variableName: info.variable,
                                    value: info.value
                                })) : []
                            })) : []
                        /** Debugging Blocks End */
                    })
                    //update the flags
                    setUseClericalReviewCandidates(config.CONFIG.clerical_review_candidates);
                    setUsePrediction(config.CONFIG.prediction);
                    setUseMambaModels(config.CONFIG.use_mamba_models)
                    setUseCustomModel(config.CONFIG.use_custom_model)
                    setDBCreationMode(config.CONFIG.database_creation_mode)
                    setCheckedValues(config.CONFIG.used_fuzzy_metrics)
                } else {
                    setActivePanels(['batchInformation', 'dbInformation', 'dataSources']);
                }
            } catch (error) {
                console.error("Error reading file:", error);
            }
        }
    };

    useEffect(() => {
        // Any side effects related to fileContent can be placed here
        // For example, logging the content or further processing
    }, [yamlData]);


    const formatKwargs = (kwarg_info) => {
        var out = {}
        for (const item in kwarg_info) {
            out[kwarg_info[item]['kwargname']] = kwarg_info[item]['kwargvalue']
        }
        return out
    }
    //the little function to reset the form and fields
    const resetForm = () => {
        form.resetFields()
        setYamlData(null)
    }

    const generatePayload = (values) => {
        console.log(values.mode)
        let payload = {

            config: {
                CONFIG: {
                    /** Project, Batch, and DB Info Begin */
                    projectPath: values.projectPath ?? '',
                    mode: values.mode ? 'deduplication' : 'linkage',
                    target_table: values.mode ? data1 : null,
                    ignore_duplicate_ids: values.ignore_duplicate_ids,
                    model_only: values.model_only,
                    debugmode: values.debugmode,
                    database_creation_mode: values.database_creation_mode,
                    create_db_chunksize: values.create_db_chunksize,
                    chatty_logger: values.chatty_logger,
                    log_file_name: values.log_file_name,
                    numWorkers: values.numWorkers,
                    imputation_method: values.imputation_method ?? 'No Imputation',
                    /** Project, Batch, and DB Info End */
                    sql_flavor: values.sql_flavor,
                    db_name: values.db_name,

                    /** Data Source Begin */
                    data1_name: values.data1,
                    data2_name: values.data2,
                    /** Data Source End */

                    /** Model Outputs Start */
                    prediction: values.prediction,
                    match_threshold: values.match_threshold ?? .5,
                    scoringcriteria: values.scoringcriteria,
                    matched_pairs_table_name: values.matched_pairs_table_name,

                    clerical_review_candidates: values.clerical_review_candidates,
                    clerical_review_candidates_table_name: values.clerical_review_candidates_table_name,

                    /** Model Outputs End */

                    /** The Model Start */
                    use_mamba_models: values.use_mamba_models,
                    use_custom_model: values.use_custom_model,
                    custom_model_name: values.custom_model_name,
                    saved_model: values.saved_model,
                    use_ada: values.use_ada,
                    use_rf: values.use_rf,
                    rf_jobs: values.rf_jobs ?? 1,
                    use_logit: values.use_logit,
                    feature_elimination_mode: values.feature_elimination_mode,
                    training_data_name: values.training_data_name,
                    saved_model_target: values.saved_model_target,
                    used_fuzzy_metrics: values.used_fuzzy_metrics,
                    /** The Model End */

                    // custom_selection_statement: {
                    //   [data1_name]: createCustomSelectionStatement(values.data1CustomSelectionStatement, values.data1SourceVintages),
                    //   [data2_name]: createCustomSelectionStatement(values.data2CustomSelectionStatement, values.data2SourceVintages)
                    // },
                    // mode: (data2disabled) ? 'deduplication' : false,
                    // use_variable_filter: 'False', // deprecating this because they can use the filter only entry more easily.
                    // variable_filter_info: {},

                },
                blocks: values.blocks.map(block => {
                    const blockJSON = {
                        order: block.order,
                        block_name: block.block_name,
                    };
                    if (!values.mode) {
                        blockJSON[data1] = block.data1BlockVar;
                        blockJSON[data2] = block.data2BlockVar;
                    } else {
                        blockJSON['left'] = block.data1BlockVar;
                        blockJSON['right'] = block.data2BlockVar;
                    }
                    if (block.variable_filter_info && block.variable_filter_info.length > 0) {
                        blockJSON.variable_filter_info = {};
                        if (!values.mode) {
                            blockJSON.variable_filter_info[data1] = block.variable_filter_info[0]['data1VariableFilter'];
                            blockJSON.variable_filter_info[data2] = block.variable_filter_info[0]['data2VariableFilter'];
                        } else {
                            blockJSON.variable_filter_info['left'] = block.variable_filter_info[0]['data1VariableFilter'];
                            blockJSON.variable_filter_info['right'] = block.variable_filter_info[0]['data2VariableFilter'];
                        }
                        blockJSON.variable_filter_info.match_type = block.variable_filter_info[0].match_type;
                        if (block.variable_filter_info[0].fuzzy_name) blockJSON.variable_filter_info.fuzzy_name = block.variable_filter_info[0].fuzzy_name;
                        if (block.variable_filter_info[0].test) blockJSON.variable_filter_info.test = block.variable_filter_info[0].test;
                        if (block.variable_filter_info[0].filter_value) blockJSON.variable_filter_info.fuzzy_name = block.variable_filter_info[0].filter_value;
                    } else {
                        blockJSON.variable_filter_info
                    }
                    return blockJSON;
                }),
                var_types: values.variable_types.map(type => {
                    const typeJSON = {
                        variable_name: type.variable_name,
                        custom_variable_name: type.custom_variable_name,
                        match_type: type.match_type
                    };
                    if (!values.mode) {
                        typeJSON[data1] = type.data1TypeVar;
                        typeJSON[data2] = type.data2TypeVar;
                    } else {
                        typeJSON['left'] = type.data1TypeVar;
                        typeJSON['right'] = type.data2TypeVar;
                    }
                    if (type.custom_kwarg_args && type.custom_kwarg_args.length > 0) {
                        typeJSON.custom_variable_kwargs = {};
                        type.custom_kwarg_args.forEach(arg => typeJSON.custom_variable_kwargs[arg.kwargname] = arg.kwargvalue)
                    }
                    if (type.filter_only && type.filter_only.length > 0) {
                        typeJSON.filter_only = {};
                        typeJSON.filter_only.test = type.filter_only[0].test;
                        typeJSON.filter_only.value = type.filter_only[0].value;
                        typeJSON.filter_only.fuzzy_name = type.filter_only[0].fuzzy_name ?? null
                    }
                    return typeJSON;
                })
            }
        };
        /* add custom selection statement */
        payload.config.CONFIG['custom_selection_statement'] = {}
        if (!values.mode) {
            payload.config.CONFIG['custom_selection_statement'][`${data1}`] = values.data1CustomSelectionStatement ?? ''
            payload.config.CONFIG['custom_selection_statement'][`${data2}`] = values.data2CustomSelectionStatement ?? ''
        } else {
            payload.config.CONFIG['custom_selection_statement']['left'] = values.data1CustomSelectionStatement ?? ''
            payload.config.CONFIG['custom_selection_statement']['right'] = values.data2CustomSelectionStatement ?? ''
        }
        /** DB Configuration */


        if (values.sql_flavor == 'postgres') {
            payload.config.CONFIG['db_host'] = values.db_host
            payload.config.CONFIG['db_port'] = values.db_port
            payload.config.CONFIG['db_schema'] = values.db_schema
            payload.config.CONFIG['db_user'] = values.db_user
            payload.config.CONFIG['db_password_env_var'] = values.db_password_env_var
        }
        /**DB Configuration End*/
        /** Debugging Blocks Start */
        if (values.debug_blocks) {
            payload.config.CONFIG['debug_blocks'] = values.debug_blocks.map(block => ({
                block_order: block.blockOrder,
                block_variable_information: block.blockVariableInformation.map(info => ({
                    variable: info.variableName,
                    value: info.value
                }))
            }))
        }
        /** Debugging Blocks End */
        /** Now Clerical Review Candidates **/
        if (payload.config.CONFIG.clerical_review_candidates === true) {
            payload.config.CONFIG['clerical_review_threshold'] = {}
            payload.config.CONFIG['clerical_review_threshold']['query_logic'] = values.query_logic
            payload.config.CONFIG['clerical_review_threshold']['listed_variable_names'] = values.clerical_review_thresholds.map(threshold => ({
                value: threshold.value,
                variable: threshold.variable_name
            }))
        }
        return payload;
    }
    const createConfiguration = (values) => {
        const payload = generatePayload(values);
        //fs.writeFileSync(`${values.projectPath}/mamba_variable_types.yaml`, yaml.dump(payload.config['var_types']), 'utf8');
        //fs.writeFileSync(`${values.projectPath}/blocks.yaml`, yaml.dump(payload.config['blocks']), 'utf8');
        downloadFile(YAML.dump(payload.config), 'mamba_config.yaml', 'text/yaml')
    }
    const batchInformationFields = <>
        <Row gutter={8}>
            <Col span={12}>
                <Form.Item
                    name="projectPath"
                    label="Project sub-folder"
                    tooltip="What is the name of the file where project files (e.g. models, custom_scoring_functions.py) are stored?"
                >
                    <Input placeholder="Enter a project sub-folder"/>
                </Form.Item>
            </Col>
            <Col span={24}>
                <Space size={'large'}>
                    <Form.Item
                        name="mode" valuePropName="checked" layout="horizontal"
                        label="Deduplication Mode"
                        tooltip="Are you linking two datasets or de-duplicating a single dataset?"
                        style={{marginBottom: 0, marginRight: 100}}
                    >
                        <Switch checkedChildren="Deduplication" unCheckedChildren="Matching"
                                onClick={handleDeduplicationChange}/>
                    </Form.Item>
                    <Form.Item
                        name="ignore_duplicate_ids" valuePropName="checked" layout="horizontal"
                        label="Ignore Duplicate IDs?"
                        tooltip="Do you want MAMBA to ignore pairs where the id variable is the same?"
                        style={{marginBottom: 0}}
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No"/>
                    </Form.Item>
                    <Form.Item
                        name="model_only" valuePropName="checked" layout="horizontal"
                        label="Model Only?"
                        tooltip="Are you just generating a model and not attempting a larger linkage?"
                        style={{marginBottom: 0}}
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No"/>
                    </Form.Item>
                    <Form.Item
                        name="debugmode" valuePropName="checked" layout="horizontal"
                        label="Debug Mode?"
                        tooltip="In debug mode, the logger is chattier and fewer model iterations are run."
                        style={{marginBottom: 0}}
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No"/>
                    </Form.Item>
                    <Form.Item
                        name="imputation_method"
                        label="Imputation Method"
                        tooltip="In the case of missing data, do you want to use an Interative Imputer, Nominal, or No Imputation (see Readme for details)"
                        style={{marginBottom: 0}}
                    >
                        <Select options={[{value: "No Imputation"}, {value: "Imputer"}, {value: "Nominal"}]}
                                defaultValue={"No Imputation"}/>
                    </Form.Item>
                </Space>
            </Col>
            <Col span={24}>
                <Space size={'large'}>
                    <Form.Item
                        name="chatty_logger" valuePropName="checked" layout="horizontal"
                        label="Chatty Logger?"
                        tooltip="True/False.  If true, the logger will give you lots and lots of updates after each block."
                        style={{marginBottom: 0}}
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No"/>
                    </Form.Item>
                    <Form.Item
                        name="log_file_name" layout="horizontal"
                        label="Log File Name"
                        tooltip="The name of the log file you want to use."
                        style={{marginBottom: 0}}
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        label="Number of Workers"
                        tooltip={"The number of sub-processors you want to run"}
                        name={'numWorkers'}>
                        <InputNumber min={1}/>
                    </Form.Item>
                </Space>
            </Col>
            <Col span={24}>
                <Space size={'large'}>
                    <Form.Item
                        name="database_creation_mode" valuePropName="checked" layout="horizontal"
                        label="Database Creation Mode"
                        tooltip="Are you linking two datasets or de-duplicating a single dataset?"
                        style={{marginBottom: 0}}
                    >
                        <Switch checkedChildren="Create" unCheckedChildren="Existing" onChange={handleDBModeChange}/>
                    </Form.Item>
                    {dbCreationMode == true && (
                        <Form.Item
                            name="create_db_chunksize"
                            label="DB Creation Chunksize"
                            tooltip="The chunk size you want to load the data into the database for."
                        >
                            <Input
                                defaultValue={100000}
                                placeholder={100000}
                            />
                        </Form.Item>
                    )}
                </Space>
            </Col>
        </Row>
    </>;
    const dbInformationFields = <>
        <Row gutter={8}>
            <Col span={4}>
                <Form.Item
                    name="sql_flavor"
                    label="SQL Flavor"
                    tooltip="Are you using SQLite or Postgres?"
                >
                    <Select
                        options={[{value: 'sqlite', label: 'SQLite'},
                            {value: 'postgres', label: 'Postgres'}]}
                        showSearch={true}
                        placeholder={'Select a database flavor'}
                        onChange={handleSqlChange}
                    />
                </Form.Item>
                <Form.Item
                    name="db_name"
                    label="DB Name"
                    tooltip="The Name of the database"
                >
                    <Input
                    />
                </Form.Item>
            </Col>
            {sqlFlavor == 'postgres' && (
                <Col span={4}>
                    <Form.Item
                        name="db_host"
                        label="DB Host"
                        tooltip="Host address of your database"
                    >
                        <Input
                        />
                    </Form.Item>
                    <Form.Item
                        name="db_schema"
                        label="DB Schema"
                        tooltip="The schema name of the database you are using (this will be the default schema where the tables live, not neccesarily where the data tables are)"
                    >
                        <Input
                        />
                    </Form.Item>
                </Col>
            )}
            {sqlFlavor == 'postgres' && (
                <Col span={4}>
                    <Form.Item
                        name="db_user"
                        label="DB Username"
                        tooltip="The database username."
                    >
                        <Input
                        />
                    </Form.Item>
                    <Form.Item
                        name="db_password_env_var"
                        label="DB Password Environment Var"
                        tooltip="The environment variable that your database password lives in., AND NOT YOUR DB PASSWORD.  "
                    >
                        <Input
                        />
                    </Form.Item>
                </Col>
            )}
            {sqlFlavor == 'postgres' && (
                <Col span={4}>
                    <Form.Item
                        name="db_port"
                        label="DB Port"
                        tooltip="The port number (for Postgres 5432, for Redshift 5439) of the database.  "
                    >
                        <Input
                        />
                    </Form.Item>
                </Col>
            )}
        </Row>
    </>;
    const dataSourcesFields = <>
        <Typography.Title level={5}>
            Data 1(The first data source)
        </Typography.Title>
        <Row gutter={8}>
            <Col span={6}>
                <Form.Item
                    label="Data 1"
                    name="data1"
                    tooltip="The source_name of the first dataset you want to link"
                    rules={[
                        {required: true, message: "Please choose the dataset for 'Data 1' in your linkage."},
                    ]}>
                    <input
                        type={"text"}
                        value={data1}
                        onChange={data1OnChange}
                    />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item
                    name="data1CustomSelectionStatement"
                    label={`${data1} Custom Selection Statement`}
                    tooltip={`What are the restrictions you want to place on this dataset? Must be resolvable SQL query after a 'where' statement.`}
                >
                    <Input placeholder={""}/>
                </Form.Item>
            </Col>
        </Row>
        {
            !deduplicationMode && <>
                <Typography.Title level={5}>
                    Data 2 (The second data source)
                </Typography.Title>
                <Row gutter={8}>
                    <Col span={6}>
                        <Form.Item
                            label="Data 2"
                            name="data2"
                            rules={[
                                {required: true, message: "Please choose the dataset for 'Data 2' in your linkage."},
                            ]}>
                            <input
                                type={"text"}
                                value={data2}
                                onChange={data2OnChange}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                            name="data2CustomSelectionStatement"
                            label={`${data2} Custom Selection Statement`}
                            tooltip={`What are the restrictions you want to place on this dataset? Must be resolvable SQL query after a 'where' statement.`}
                        >
                            <Input placeholder={""}/>
                        </Form.Item>
                    </Col>
                </Row>
            </>
        }
    </>;
    const blockingAndVariableInformationFields = <>
        <Typography.Title level={5}>
            Block Information <Switch value={blockInfoExpanded}
                                      onChange={() => setBlockInfoExpanded(!blockInfoExpanded)}
                                      checkedChildren="Expanded View" unCheckedChildren="Collapsed View"/>
        </Typography.Title>
        <Form.List name="blocks">
            {(fields, {add, remove}) => (
                <Flex wrap gap="small">
                    {fields.map((field) => (
                        <Card
                            size="small"
                            style={blockInfoExpanded ? {width: 600} : {}}
                            key={field.key}
                            extra={
                                <CloseOutlined
                                    onClick={() => {
                                        remove(field.name);
                                    }}
                                />
                            }
                        >
                            {
                                blockInfoExpanded ? <>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Order"
                                                name={[field.name, 'order']}>
                                                <InputNumber min={1}/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Block Name"
                                                name={[field.name, 'block_name']}>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Form.Item
                                                label={`${data1Display} variable(s)`}
                                                name={[field.name, 'data1BlockVar']}
                                                rules={[{min: 2, message: 'foo'}]}
                                                tooltip='comma and space-separated variables used to construct this block.'>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label={`${data2} variable(s)`}
                                                name={[field.name, 'data2BlockVar']}
                                                tooltip='comma and space-separated variables used to construct this block.'>
                                                <Input disabled={data2disabled}/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.List
                                        name={[field.name, 'variable_filter_info']}>
                                        {(subFields, subOpt) => (
                                            <div style={{maxHeight: 4000, overflow: 'auto', paddingRight: 10}}>
                                                {subFields.map((subField) => (
                                                    <Card
                                                        extra={
                                                            <CloseOutlined
                                                                onClick={() => {
                                                                    subOpt.remove(subField.name);
                                                                }}/>
                                                        }>
                                                        <Row gutter={8}>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label={`${data1Display} variable name`}
                                                                    name={[subField.name, 'data1VariableFilter']}>
                                                                    <Input/>
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label={`${data2} variable name`}
                                                                    name={[subField.name, 'data2VariableFilter']}>
                                                                    <Input/>
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                        <Row gutter={8}>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label="Match Type"
                                                                    name={[subField.name, 'match_type']}
                                                                >
                                                                    <Select
                                                                        options={[{value: 'fuzzy', label: 'Fuzzy'},
                                                                            {
                                                                                value: 'num_distance',
                                                                                label: 'Numeric Distance'
                                                                            },
                                                                            {value: 'exact', label: 'Exact'},
                                                                            {value: 'soundex', label: 'Soundex'},
                                                                            {value: 'nysiis', label: 'NYSIIS'},
                                                                            {
                                                                                value: 'geo_distance',
                                                                                label: 'Geographic Distance'
                                                                            },
                                                                            {value: 'date', label: 'Date'},
                                                                            {value: 'custom', label: 'Custom'}]}
                                                                        showSearch={true}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label="Fuzzy Name"
                                                                    name={[subField.name, 'fuzzy_name']}
                                                                >
                                                                    <Input
                                                                        disabled={matchType==='fuzzy'}
                                                                        placeholder='Only available when Match Type = Fuzzy'/>
                                                                </Form.Item>
                                                            </Col>
                                                        </Row>
                                                        <Row gutter={8}>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label="Test"
                                                                    name={[subField.name, 'test']}>
                                                                    <Select
                                                                        // options={[{ value: '==', label: 'Equals' },
                                                                        // { value: '!=', label: 'Does not equal' },
                                                                        // { value: '>', label: 'Greater Than' },
                                                                        // {
                                                                        //   value: '>=',
                                                                        //   label: 'Greater Than or Equal to'
                                                                        // },
                                                                        // { value: '<', label: 'Less Than' },
                                                                        // {
                                                                        //   value: '<=',
                                                                        //   label: 'Less Than or Equal to'
                                                                        // },
                                                                        // { value: 'custom', label: 'Custom' }]}
                                                                        options={[
                                                                            {value: '==', label: '=='},
                                                                            {value: '!=', label: '!='},
                                                                            {value: '>', label: '>'},
                                                                            {value: '>=', label: '>='},
                                                                            {value: '<', label: '<'},
                                                                            {value: '<=', label: '<='},
                                                                            {value: 'custom', label: 'Custom'}
                                                                        ]}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={12}>
                                                                <Form.Item
                                                                    label="Filter Value"
                                                                    name={[subField.name, 'filter_value']}>
                                                                    <Input/>
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={2}>
                                                            </Col>
                                                        </Row>
                                                    </Card>
                                                ))}
                                                <Button type="dashed" onClick={() => subOpt.add()} block
                                                        disabled={subFields.length > 0}>
                                                    + Add Variable Filter Information
                                                </Button>

                                            </div>
                                        )}
                                    </Form.List>
                                </> : <>
                                    <Form.Item
                                        label="Block Name"
                                        name={[field.name, 'block_name']}>
                                        <Input/>
                                    </Form.Item>
                                </>
                            }

                        </Card>
                    ))}
                    <span onClick={() => add()}>
            <Dragger
                openFileDialogOnClick={false}
                onDrop={(e) => {
                    e.preventDefault();
                }}>

              <p className="ant-upload-drag-icon">
                <PlusOutlined/>
              </p>
              <p className="ant-upload-text">
                Add Blocking Level
              </p>
              <p className="ant-upload-hint">
                Enter the blocks you wish to run.
              </p>
            </Dragger>
          </span>
                </Flex>
            )}
        </Form.List>
        <Typography.Title level={5}>
            Variable Types <Switch value={variableTypesExpanded}
                                   onChange={() => setVariableTypesExpanded(!variableTypesExpanded)}
                                   checkedChildren="Expanded View" unCheckedChildren="Collapsed View"/>
        </Typography.Title>
        <Form.List name="variable_types">
            {(fields, {add, remove}) => (
                <Flex wrap gap="small">
                    {fields.map((field) => (
                        <Card
                            size="small"
                            style={variableTypesExpanded ? {width: 600} : {}}
                            key={field.key}
                            extra={
                                <CloseOutlined
                                    onClick={() => {
                                        remove(field.name);
                                    }}
                                />
                            }
                        >
                            {
                                variableTypesExpanded ? <>
                                    <Row gutter={8}>
                                        <Col span={8}>
                                            <Form.Item
                                                label="Variable Name"
                                                name={[field.name, 'variable_name']}>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                label={`${data1Display} variable`}
                                                name={[field.name, 'data1TypeVar']}
                                                tooltip={`Variable (field) name used to construct this variable in ${data1}`}>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                label={`${data2} variable`}
                                                name={[field.name, 'data2TypeVar']}
                                                tooltip={`Variable (field) name used to construct this variable in ${data2}`}>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={8}>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Match Type"
                                                name={[field.name, 'match_type']}
                                                tooltip={`What type of match (see Readme) is used?`}>
                                                <Select
                                                    options={[{value: 'fuzzy', label: 'Fuzzy'},
                                                        {value: 'num_distance', label: 'Numeric Distance'},
                                                        {value: 'exact', label: 'Exact'},
                                                        {value: 'soundex', label: 'Soundex'},
                                                        {value: 'nysiis', label: 'NYSIIS'},
                                                        {value: 'geo_distance', label: 'Geographic Distance'},
                                                        {value: 'date', label: 'Date'},
                                                        {value: 'custom', label: 'Custom'}]}
                                                    showSearch={true}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                label="Custom Variable Name"
                                                name={[field.name, 'custom_variable_name']}
                                                tooltip={`If using a custom variable, enter its name here`}>
                                                <Input/>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.List
                                        name={[field.name, 'custom_kwarg_args']}>
                                        {(subFields, subOpt) => (
                                            <div style={{overflow: 'auto', marginBottom: 5}}>
                                                <Space style={{marginBottom: 2}}>
                                                    {subFields.map((subField) => (
                                                        <Card
                                                            style={{width: 200}}
                                                            size="small"
                                                            key={subField.key}
                                                            extra={
                                                                <CloseOutlined
                                                                    onClick={() => {
                                                                        subOpt.remove(subField.name);
                                                                    }}
                                                                />
                                                            }
                                                        >
                                                            <Form.Item
                                                                label={`Keyword Argument Name`}
                                                                name={[subField.name, 'kwargname']}>
                                                                <Input/>
                                                            </Form.Item>
                                                            <Form.Item
                                                                label={`Keyword Argument Value`}
                                                                name={[subField.name, 'kwargvalue']}>
                                                                <Input/>
                                                            </Form.Item>
                                                        </Card>
                                                    ))}
                                                    <span onClick={() => subOpt.add()}>
                            <Dragger
                                style={{width: 250}}
                                openFileDialogOnClick={false}>
                              <p className="ant-upload-drag-icon">
                                <PlusOutlined/>
                              </p>
                              <p className="ant-upload-text">
                                Add Custom Variable Kwargs
                              </p>
                                <p className="ant-upload-hint" style={{width: 200}}>
                                 If this variable is a custom variable, add keyword arguments here.
                                 </p>
                            </Dragger>
                          </span>
                                                </Space>
                                            </div>
                                        )}
                                    </Form.List>
                                    <Form.List
                                        name={[field.name, 'filter_only']}>
                                        {(subFields, subOpt) => (
                                            <div style={{overflow: 'auto'}}>
                                                <Space style={{marginBottom: 10}}>
                                                    {subFields.map((subField) => (
                                                        <Card
                                                            style={{width: 200}}
                                                            size="small"
                                                            key={subField.key}
                                                            extra={
                                                                <CloseOutlined
                                                                    onClick={() => {
                                                                        subOpt.remove(subField.name);
                                                                    }}
                                                                />
                                                            }
                                                        >
                                                            <Form.Item
                                                                label={`Filter Test`}
                                                                tooltip={'What test are you filtering with?'}
                                                                name={[subField.name, 'test']}>
                                                                <Select
                                                                    options={[{value: '==', label: 'Equals'},
                                                                        {value: '!=', label: 'Does not equal'},
                                                                        {value: '>', label: 'Greater Than'},
                                                                        {
                                                                            value: '>=',
                                                                            label: 'Greater Than or Equal to'
                                                                        },
                                                                        {value: '<', label: 'Less Than'},
                                                                        {
                                                                            value: '<=',
                                                                            label: 'Less Than or Equal to'
                                                                        },
                                                                        {value: 'custom', label: 'Custom'}]}
                                                                    showSearch={true}
                                                                />
                                                            </Form.Item>
                                                            <Form.Item
                                                                label={`Value`}
                                                                tooltip={'Enter the value you want to test on'}
                                                                name={[subField.name, 'value']}>
                                                                <Input placeholder=""/>
                                                            </Form.Item>
                                                            <Form.Item
                                                                label="Fuzzy Name"
                                                                tooltip={"If this is a fuzzy variable, what is the fuzzy metric (e.g. jaro, qgram3) you want to use?"}
                                                                name={[subField.name, 'fuzzy_name']}>
                                                                <Input/>
                                                            </Form.Item>
                                                        </Card>
                                                    ))}
                                                    <span onClick={() => subOpt.add()}>
                            <Dragger
                                style={{width: 250}}
                                openFileDialogOnClick={false}>
                              <p className="ant-upload-drag-icon">
                                <PlusOutlined/>
                              </p>
                              <p className="ant-upload-text">
                                Click to Make This Variable A Filter
                              </p>
                                <p className="ant-upload-hint" style={{width: 200}}>
                                 Use this feature to use this variable only to filter potential matches.
                                 </p>
                            </Dragger>
                          </span>
                                                </Space>
                                            </div>
                                        )}
                                    </Form.List>
                                </> : <>
                                    <Form.Item
                                        label="Variable Name"
                                        name={[field.name, 'variable_name']}>
                                        <Input/>
                                    </Form.Item>
                                </>
                            }

                        </Card>
                    ))}
                    <span onClick={() => add()}>
            <Dragger
                openFileDialogOnClick={false}
                onDrop={(e) => {
                    e.preventDefault();
                }}>

              <p className="ant-upload-drag-icon">
                <PlusOutlined/>
              </p>
              <p className="ant-upload-text">
                Add Variable Type
              </p>
              <p className="ant-upload-hint" style={{width: 300}}>
                Enter the independent variables (features) that
                will determine if a pair of records are a match.
              </p>
            </Dragger>
          </span>
                </Flex>
            )}
        </Form.List>
    </>;
    const modelOutputsFields = <>
        <Typography.Title level={5}>
            Predictions
        </Typography.Title>
        <Row gutter={8}>
            <Col span={3}>
                <Form.Item
                    name="prediction"
                    label="Generate?"
                    tooltip="Do you want to generate predicted linkages using a model?"
                >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" onClick={handlePredictionChange}/>
                </Form.Item>
            </Col>
            {usePrediction && (
                <Col span={7}>
                    <Form.Item
                        name="match_threshold"
                        label="Match Threshold"
                        tooltip="What is the match threshold you want to apply to your model?"
                        rules={[
                            {required: usePrediction, message: "Please choose a match threshold."},
                        ]}
                    >
                        <InputNumber min={0} maxfractiondigits={2} step={.05} defaultValue={.5}/>
                    </Form.Item>
                </Col>
            )}
            {usePrediction && (
                <Col span={7}>
                    <Form.Item
                        name="scoringcriteria"
                        label="Scoring Criteria"
                        tooltip="What scoring criteria are you applying to the model?"
                        rules={[
                            {required: useMambaModels, message: "Please choose a scoring criteria."},
                        ]}
                    >
                        <Input/>
                    </Form.Item>
                </Col>
            )}
            {usePrediction && (
                <Col span={7}>
                    <Form.Item
                        name="matched_pairs_table_name"
                        label="Matched Pairs Table Name"
                        tooltip="What is the name of the matched pairs table you want to push linkages to?"
                        rules={[
                            {required: usePrediction, message: "Please choose a matched pairs table name."},
                        ]}
                    >
                        <Input/>
                    </Form.Item>
                </Col>)}

        </Row>
        <Typography.Title level={5}>
            Clerical Review Candidates
        </Typography.Title>
        <Row gutter={8}>
            <Col span={3}>
                <Form.Item
                    name="clerical_review_candidates"
                    label="Generate?"
                    tooltip="Do you want to generate clerical review candidates?"
                >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleClericalReviewChange}/>
                </Form.Item>
            </Col>
            {useClericalReviewCandidates && (
                <Col span={7}>
                    <Form.Item
                        name="clerical_review_candidates_table_name"
                        label="Clerical Review Candidates Table Name"
                        tooltip="What is the name of the clerical review candidates table you want to push candidate pairs to?"
                    >
                        <Input/>
                    </Form.Item>
                </Col>
            )}
            {useClericalReviewCandidates && (
                <Col span={7}>
                    <Form.Item
                        label="Clerical Review Thresholds">
                        <Form.List name='clerical_review_thresholds'>
                            {(subFields, subOpt) => (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    rowGap: 8
                                }}>
                                    {subFields.map((subField) => (
                                        <Space key={subField.key}>
                                            <Form.Item
                                                label={`Variable Name`}
                                                name={[subField.name, 'variable_name']}
                                                tooltip={"The name of the variable you want to serve as a filter.  If this is a fuzzy variable, needs to be of the form {variable_name}_{fuzzy_comparison}"}>
                                                <Input placeholder=""/>
                                            </Form.Item>
                                            <Form.Item
                                                label={`Value`}
                                                name={[subField.name, 'value']}
                                                tooltip={"The value that all clerical review thresholds must be greater than to be counted."}>
                                                <Input placeholder=""/>
                                            </Form.Item>
                                            <CloseOutlined
                                                onClick={() => {
                                                    subOpt.remove(subField.name);
                                                }}
                                            />
                                        </Space>
                                    ))}
                                    <Button type="dashed" onClick={() => subOpt.add()} block>
                                        + Add Clerical Review Threshold
                                    </Button>
                                </div>
                            )}
                        </Form.List>
                    </Form.Item>
                </Col>
            )}
            {useClericalReviewCandidates && (
                <Col span={7}>
                    <Form.Item
                        label="Query Logic"
                        name='query_logic'
                        tooltip="If using multiple thresholds, what is the logic to include candidates?">
                        <Cascader
                            options={[
                                {value: 'and', label: 'And'},
                                {value: 'or', label: 'Or'}]}
                            showSearch={true}
                        />
                    </Form.Item>
                </Col>
            )}
        </Row>
    </>;
    const modelFields = <>
        <Row gutter={8}>
            <Col span={24}>
                <Space align="start" size="large">
                    <Form.Item
                        name="use_mamba_models"
                        label="Use Built-In MAMBA models?"
                        tooltip="Do you want to use built-in MAMBA models (Random Forest, Adaboost, Logit?)"
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleMambaModelChange}/>
                    </Form.Item>
                    <Form.Item
                        name="use_custom_model"
                        label="Fit a Custom model?"
                        tooltip="Do you want to use a custom model you have built? Useful if you want to alter the default assumptions of the MAMBA ML models"
                    >
                        <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleCustomModelChange}/>
                    </Form.Item>
                    <Form.Item
                        name="custom_model_name"
                        label="Custom Model Name"
                        tooltip="The name of the class within custom_model you want to use."
                    >
                        <Input placeholder="Model name" disabled={!useCustomModel}/>
                    </Form.Item>
                    <span>OR</span>
                    <Form.Item
                        name="saved_model"
                        label="Use Saved Model?"
                        tooltip="The name (including .joblib ending) of a pre-made model you wish to use."
                    >
                        <Input placeholder="Model name" disabled={useMambaModels || useCustomModel}/>
                    </Form.Item>
                </Space>
            </Col>
        </Row>
        <Card style={{marginBottom: 10}}>
            <Row gutter={8}>
                <Col span={24}>
                    <Space size="large">
                        <Form.Item
                            name="use_ada" valuePropName="checked" layout="horizontal"
                            label={"Fit an AdaBoost Model?"}
                            tooltip="Do you want MAMBA to try to fit an AdaBoosted Tree Algorithm?"
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" disabled={!useMambaModels}/>
                        </Form.Item>
                        <Form.Item
                            name="use_rf" valuePropName="checked" layout="horizontal"
                            label={"Fit a Random Forest Model?"}
                            tooltip="Do you want MAMBA to try to fit Random Forest model?"
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" onChange={handleRandomForestChange}
                                    disabled={!useMambaModels}/>
                        </Form.Item>
                        <Form.Item
                            name="use_logit" valuePropName="checked" layout="horizontal"
                            label={"Fit a Logistic Regression?"}
                            tooltip="Do you want MAMBA to try to fit Logistic Regression model?"
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" disabled={!useMambaModels}/>
                        </Form.Item>
                        <Form.Item
                            name="feature_elimination_mode" valuePropName="checked" layout="horizontal"
                            label={"Feature Elimination Mode?"}
                            tooltip="In feature elimination mode, MAMBA attempts to find the minimum number of features that attain the maximized fit.  This is more computationally expensive to build the model but results in much faster matching later. So it's vegetables...but for record linkage."
                        >
                            <Switch checkedChildren="Yes" unCheckedChildren="No" disabled={!useMambaModels}/>
                        </Form.Item>
                        <Form.Item
                            name="rf_jobs"
                            label="Random Forest Jobs"
                            tooltip="The number of jobs you want to have the random forest run (more jobs = more memory but faster processing)."
                        >
                            <Input disabled={!useRandomForest}/>
                        </Form.Item>
                    </Space>
                </Col>
                <Col span={12}>
                    {/*More Model Configurations: Training Data*/}
                    <Form.Item
                        name="training_data_name"
                        label="Training Data File"
                        tooltip="The name of the file that contains the training data for the model."
                    >
                        <Input disabled={!useMambaModels}/>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="saved_model_target"
                        label="Saved Model Name?"
                        tooltip="The name of the file you want to give your newly created model."
                    >
                        <Input disabled={!useMambaModels}/>
                    </Form.Item>
                </Col>
            </Row>
        </Card>
        {/*More Model Configurations: Fuzzy Metrics*/}
        <Row>
            <Col span={120}>
                <Form.Item
                    label="Fuzzy Variables Used"
                    name="used_fuzzy_metrics"
                    valuePropName="checked">
                    <Checkbox.Group
                        options={fuzzyOptions}
                        defaultValue={checkedValues}
                    />
                </Form.Item>
            </Col>
        </Row>
    </>;
    const debugBlocksFields = <>
        <Form.List name="debug_blocks">
            {(fields, {add, remove}) => (
                <Flex wrap gap="small">
                    {fields.map((field) => (
                        <Card
                            size="small"
                            style={{width: 600}}
                            title={`Order ${field.name + 1}`}
                            key={field.key}
                            extra={
                                <CloseOutlined
                                    onClick={() => {
                                        remove(field.name);
                                    }}
                                />
                            }
                        >
                            {/* Nest Form.List for the block level information */}
                            <Form.Item
                                name={[field.name, 'blockOrder']}
                                label="Block Order"
                                tooltip="The block order of the debug block."
                            >
                                <Input/>
                            </Form.Item>
                            <Form.List
                                name={[field.name, "blockVariableInformation"]}>
                                {(subFields, subOpt) => (
                                    <div style={{overflow: 'auto'}}>
                                        <Space style={{marginBottom: 10}}>
                                            {subFields.map((subField) => (
                                                <Card
                                                    style={{width: 200}}
                                                    size="small"
                                                    title={`Variable ${subField.name + 1}`}
                                                    key={subField.key}
                                                    extra={
                                                        <CloseOutlined
                                                            onClick={() => {
                                                                subOpt.remove(subField.name);
                                                            }}
                                                        />
                                                    }
                                                >
                                                    <Form.Item
                                                        name={[subField.name, 'variableName']}
                                                        label="Variable Name"
                                                        tooltip="The name of the Variable."
                                                    >
                                                        <Input/>
                                                    </Form.Item>
                                                    <Form.Item
                                                        name={[subField.name, 'value']}
                                                        label="Value"
                                                        tooltip="The value."
                                                    >
                                                        <Input/>
                                                    </Form.Item>
                                                </Card>
                                            ))}
                                            <span onClick={() => subOpt.add()}>
                        <Dragger
                            style={{width: 200}}
                            openFileDialogOnClick={false}>
                          <p className="ant-upload-drag-icon">
                            <PlusOutlined/>
                          </p>
                          <p className="ant-upload-text">
                            Add Block Selection Variable
                          </p>
                        </Dragger>
                      </span>
                                        </Space>
                                    </div>
                                )}
                            </Form.List>
                        </Card>
                    ))}

                    <span onClick={() => add()}>
            <Dragger
                openFileDialogOnClick={false}
                onDrop={(e) => {
                    console.log('Dropped files');
                    e.preventDefault();
                }}>

              <p className="ant-upload-drag-icon">
                <PlusOutlined/>
              </p>
              <p className="ant-upload-text">
                Add a Debugging Block
              </p>
              <p className="ant-upload-hint">
                A particular block used to limit your configuration for testing.
              </p>
            </Dragger>
          </span>
                </Flex>
            )}
        </Form.List>
    </>;
    return (
        <Card
            styles={{wrapper: {height: '100vh'}}}
            title={<>Mamba Configuration Page.
                <div></div>
                Use this page to create a configuration. Once you click 'Save Form Configuration', save the downloaded
                file into your project directory.
                <div></div>
                <Tooltip title="Choose the layout style to view the form">
                    <div></div>
                    <Switch checked={defaultLayout} onChange={() => setDefaultLayout(!defaultLayout)}
                            checkedChildren="Accordion" unCheckedChildren="Step"/>
                </Tooltip></>}
            open={props.open}
            placement="bottom"
            extra={[
                <div>
                    Save the configuration?
                </div>,
                <Button form="configurationForm" key="submit" htmlType="submit" type="primary">Save Form
                    Configuration</Button>,
                <div>
                    Reset the configuration?
                </div>,
                <Button onClick={resetForm} key="Reset" style={{marginRight: 5}}>Reset Form</Button>,
                <div>
                    Upload an existing configuration?
                </div>,
                <Input type="file" accept=".yaml, .yml" allowClear size={"small"}
                       onChange={handleFileChange}
                       placeholder={""}
                       name="Upload Existing Configuration."/>
            ]}>
            <Form layout="vertical" id="configurationForm"
                  onFinish={createConfiguration}
                  form={form}
                  initialValues={
                      {
                          /**project and batch information */
                          projectPath: '',
                          mode: false,
                          model_only: false,
                          database_creation_mode: false,
                          create_db_chunksize: null,
                          /**db information */
                          sql_flavor: null,
                          db_name: null,
                          /**data source information */
                          data1: null,
                          data1CustomSelectionStatement: '',
                          data2: null,
                          data2CustomSelectionStatement: '',
                          /**block names and types */
                          blocks: [],
                          variable_types: [],
                          /**model outputs */
                          prediction: false,
                          match_threshold: .5,
                          scoringcriteria: '',
                          matched_pairs_table_name: '',
                          clerical_review_candidates: false,
                          clerical_review_candidates_table_name: '',
                          clerical_review_thresholds: [],
                          query_logic: '',
                          /**the model */
                          use_mamba_models: false,
                          saved_model: '',
                          use_ada: false,
                          use_rf: false,
                          rf_jobs: 1,
                          use_logit: false,
                          feature_elimination_mode: false,
                          training_data_name: '',
                          saved_model_target: '',
                          used_fuzzy_metrics: [],
                          /**debug blocks */
                          debug_blocks: []
                      }}>
                {
                    defaultLayout ?
                        <Collapse size="small" collapsible="icon"
                                  activeKey={activePanels}
                                  onChange={(panels) => setActivePanels(panels)}
                                  items={[
                                      {
                                          key: 'batchInformation',
                                          label: 'Project and Batch Information.',
                                          children: batchInformationFields
                                      },
                                      {
                                          key: 'dbInformation',
                                          label: 'DB Information',
                                          children: dbInformationFields
                                      },
                                      {
                                          key: 'dataSources',
                                          label: 'Data Sources',
                                          children: dataSourcesFields
                                      },
                                      {
                                          key: 'blockingAndVariableInformation',
                                          label: 'Blocking and Variable Information',
                                          children: blockingAndVariableInformationFields,
                                          collapsible: ((data1 && data2) || (data1 && deduplicationMode)) ? 'icon' : 'disabled'
                                      },
                                      {
                                          key: 'modelOutputs',
                                          label: 'Model Outputs',
                                          children: modelOutputsFields,
                                          collapsible: (data1 && data2) ? 'icon' : 'disabled'
                                      },
                                      {
                                          key: 'model',
                                          label: 'The Model',
                                          children: modelFields,
                                          collapsible: (data1 && data2) ? 'icon' : 'disabled'
                                      },
                                      {
                                          key: 'debugBlocks',
                                          label: 'Debugging Blocks (Optional)',
                                          children: debugBlocksFields,
                                          collapsible: (data1 && data2) ? 'icon' : 'disabled'
                                      }
                                  ]}/>
                        :
                        <>
                            <Steps current={currentStep} onChange={(value) => setCurrentStep(value)}
                                   items={[
                                       {title: 'Project and Batch Information'},
                                       {title: 'DB Information'},
                                       {title: 'Data Sources'},
                                       {title: 'Blocking and Variable Information'},
                                       {title: 'Model Outputs'},
                                       {title: 'The Model'},
                                   ]}/>
                            <div style={contentStyle}>
                                {currentStep === 0 && batchInformationFields}
                                {currentStep === 1 && dbInformationFields}
                                {currentStep === 2 && dataSourcesFields}
                                {currentStep === 3 && blockingAndVariableInformationFields}
                                {currentStep === 4 && modelOutputsFields}
                                {currentStep === 5 && modelFields}
                                {currentStep === 6 && debugBlocksFields}
                            </div>
                        </>
                }
            </Form>
            <Modal title="JSON Configuration"
                   open={jsonConfigModalOpen}
                   width={800}
                   styles={{body: {maxHeight: '900px', overflow: 'auto'}}}
                   footer={[
                       <Button key="ok" type="primary" onClick={() => setJsonConfigModalOpen(false)}>OK</Button>
                   ]}
                   onCancel={() => setJsonConfigModalOpen(false)}>
                <ReactJson src={currentPayload}
                           theme={themePreset === 'dark' ? 'twilight' : 'rjv-default'}
                           displayObjectSize={false}
                           displayDataTypes={false}
                           enableClipboard={false}/>
            </Modal>
        </Card>
    )
}
export default RecordLinkageConfigurationFullScreen;