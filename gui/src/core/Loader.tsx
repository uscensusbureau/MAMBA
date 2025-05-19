import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notification } from 'antd';
import { useRecoilValue, useRecoilState } from "recoil";
import { pageLoadingAtom } from 'src/state/app/pageLoadingAtom';
import Cookies from 'js-cookie';

function Loader() {
  let navigate = useNavigate();
  const [pageLoading, setPageLoading] = useRecoilState(pageLoadingAtom);
  useEffect(() => {

    //Add request interceptors
    axios.interceptors.request.use(function (config) {

        // Return the crsf cookie for everything except get
        if (config.method != 'get'){
          const csrf_token = Cookies.get('csrf_access_token');
          config.headers['X-CSRF-TOKEN'] = csrf_token;
        }

        return config;
      }, function (error) {
    });

    //Add response interceptors
    axios.interceptors.response.use(
      res => {
        if (res.data.errorCode) {
          notification.error({
            message: res.data.errorCode,
            description: `${res.data.errorString} An Error Occurred`
          });
        }
        return res;
      },
      //this runs if an error occurs
      error => {
        setPageLoading(false);
        console.log('** error: ' + JSON.stringify(error));
        if (/*!error || !error.response ||*/ error?.response?.status === 403 || error?.response?.status === 401) {
          sessionStorage.removeItem('selectedFrame');
          sessionStorage.removeItem('selectedSources');
          navigate('/login?error=' + (error && error.response ? 'UnauthorizedAccess' : 'NetworkError'));
        } else {
          notification.error({
            message: `${error.response?.status ? 'Error Status ' + error.response.status : 'Unexpected Error'}`,
            description: error.response?.data
          });
        }
        //some other error occurred ( non-403 )
        // else if (error.config.headers.loader || error.config.headers.error || error.response.status !== 200) {
        // }
        return Promise.reject(error);
      }
    );
  }, []);
  return true;
}
export default Loader;