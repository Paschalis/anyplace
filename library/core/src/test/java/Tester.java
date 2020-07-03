import cy.ac.ucy.cs.anyplace.*;


import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Arrays;


import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

public class Tester {
    static String response;
    static String buid;
    static String access_token;
    static String pois_to;
    static String coordinates_la;
    static String coordinates_lo;
    static String floor;
    static String pois_from;
    static String range;
    static String algorithm;
    static Preferences preferences;

    public static boolean isNumeric(String str) {
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    @BeforeClass
    public static void setUpParameters() throws Exception {
        preferences = new Preferences();
        buid = "username_1373876832005";
        access_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhjNThlMTM4NjE0YmQ1ODc0MjE3MmJkNTA4MGQxOTdkMmIyZGQyZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNTg3NTAwNzIzOTcxLXNpOHM0cXFhdDl2NWVmZ2VtbmViaWhwaTNxZTlvbmxwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNTg3NTAwNzIzOTcxLXNpOHM0cXFhdDl2NWVmZ2VtbmViaWhwaTNxZTlvbmxwLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA0NDQxMzA0OTI3MzE2MzM5NDM2IiwiZW1haWwiOiJhY2hpbC5jaHJpc3Rvc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6InpSVUJ4cVBjT29xejB0cVpkNEg1WnciLCJuYW1lIjoiY2hyaXN0b3MgYWNoaWxsZW9zIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS8tVTVqVzlpRk9kRVEvQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQUNIaTNyYzZfTEEzLWV2dGFJbXVTdDU0cFJRdmd1T1BOQS9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoiY2hyaXN0b3MiLCJmYW1pbHlfbmFtZSI6ImFjaGlsbGVvcyIsImxvY2FsZSI6ImVuIiwiaWF0IjoxNTcwMDIzNDE2LCJleHAiOjE1NzAwMjcwMTYsImp0aSI6ImMxMWY2YzIwMjgwZjc1YmMxZjE4NDMzM2QyZGM5NWY4MTYxYTZkNWUifQ.W_8IsTty5D7UdbcHkjrHyhNkEOyFc1r8fluvnd3kpV5wmK9Z4Tb0zv-W9DOr6mOGZUbaLvHR0Hncbqgec_iN9YNV281O3NRd-XERsn-Gf3oZ2z0Nbm5-_4NRg-WkLER4Ouo-upCd9TvXZwWqK0NNZm1Ka8N_JCzU0vb29T7lASZAZQ5POLtg3Z7PoAIk-h1HoO8Wb8acb-fkVaoLd-WR4sEhC93mxEaKe3DycXT0QtaO27GAYypz6HfWM3PsyPHio9nGr-GSt7ZNZuJYjnzqyRhXnx-H2dRggWbS6EAREWmBH2sdWe7fzMBFt_GNCl9q3yGVJQht5IOTmPDG9gixsw";
        pois_to = "poi_064f4a01-07bd-45fa-9579-63fa197d3d90";
        coordinates_la = "35.14414934169342";
        coordinates_lo = "33.41130472719669";
        floor = "-1";
        pois_from = "poi_88a34fd5-75bd-4601-81dc-fe5aef69bd3c";
        range = "100";
        algorithm = "1";
    }

    @Before
    public void setUp() throws Exception {
        // Code executed before each test
    }

    @Test
    public void testPreferences(){

        Anyplace client = new Anyplace(preferences);
        //System.out.println(client.getHost() +  " " + client.getPort() + " " + client.getCache());
        //System.out.println(preferences.status);
        response = client.allBuildingFloorPOIs(buid, floor);
        //System.out.println(response + "\n");
    }

    @Test
    public void testPoiDetailsWithKey(){
        Anyplace client = new Anyplace(preferences);

        response = client.poiDetails(pois_from);
        //System.out.println(response + "\n");

    }

    @Test
    public void testMacFingerprints() {
        String cmd[] = new String[3];
        cmd[0] = "/bin/sh";
        cmd[1] = "-c";
        cmd[2] = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/A/Resources/airport -s | grep ':' | tr -s ' ' | cut -d' ' -f3 -f4| tr ' ' '\n'";

        String aps[] = new String[200];
        Process p;
        String s, temp;
        int counter = 0;
        try {
            p = Runtime.getRuntime().exec(cmd);

            BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
            while ((s = br.readLine()) != null && counter <= 20) {
                temp = "{\"bssid\":\"";
                temp += s;
                temp += "\",\"rss\":";
                s = br.readLine();
                if (!isNumeric(s)) {
                    continue;
                }
                temp += s;
                temp += "}";
                temp = temp.toLowerCase();
                aps[counter++] = temp;
            }
            p.destroy();
            br.close();
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        aps = Arrays.copyOf(aps, counter);
        for (int j = 0; j < counter; j++) {

            //System.out.println(aps[j]);
        }
        Anyplace client2 = new Anyplace("ap-dev.cs.ucy.ac.cy", "443", "res/");

        response = client2.estimatePosition(buid, floor, aps, algorithm);
        //System.out.println(response + "\n");

    }

    @Test
    public void testRadioHeatMapBuildingFoor() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.radioheatMapBuildingFloor(buid, floor);
        System.out.println(response + "\n");

    }

    @Test
    public void testRadioByBuildingFloorRange() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.radioByBuildingFloorRange( buid, floor, coordinates_la, coordinates_lo, range);
        //System.out.println(response + "\n");
    }

    @Test
    public void testAllBuildingFloorPOIs() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.allBuildingFloorPOIs(buid, floor);
        System.out.println(response + "\n");
    }

    @Test
    public void testFloorplans64() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.floorplans64(access_token, buid, floor);
        //System.out.println(response.substring(0, 100) + "\n");
    }

    @Test
    public void testFloortiles() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.floortiles(access_token, buid, floor);
        //System.out.println(response/* .substring(0, 100) */ + "\n");
    }

    @Test
    public void testRadioByBuildingFloor() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.radioByBuildingFloor(access_token, buid, floor);
        //System.out.println(response/* .substring(0, 100) */ + "\n");
    }

    @Test
    public void testNavigationXY() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.navigationXY(access_token, pois_to, buid, floor, coordinates_la, coordinates_lo);
        //System.out.println(response/* .substring(0, 100) */ + "\n");

    }
    @Test
    public void testRadioByCoordinatesFloor() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.radioByCoordinatesFloor(access_token, coordinates_la, coordinates_lo, floor);
        //System.out.println(response + "\n");
    }
    @Test
    public void testAllBuildingFloors() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");


        response = client.allBuildingFloors(buid);
        //System.out.println(response + "\n");

    }
    @Test
    public void testNavigationPoiToPoi() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.navigationPoiToPoi(access_token, pois_to, pois_from);
        //System.out.println(response + "\n");
    }

    @Test
    public void testConnectionsByFloor() {
        Anyplace client = new Anyplace("ap.cs.ucy.ac.cy", "443", "res/");

        response = client.connectionsByFloor(buid, floor);
        //System.out.println(response +"\n");
    }

    @After
    public void tearDown() throws Exception {
        // Code executed after each test
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        // Code executed after the last test method
    }

}
