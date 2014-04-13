String.prototype.format = function (args) {
    var newStr = this;
    for (var key in args) {
        newStr = newStr.replace('{' + key + '}', args[key]);
    }
    return newStr;
}

var Serie = function (item) {
    this.title = item.title;
    this.longDescription = item.longDescription;
    this.posterURL = item.posterURL;

    this.getPoster = function () {
        setTimeout(function () { return this.posterURL; }, 500);
    }
};

var topserieUrl = "http://192.168.1.19/webapp/EverStreamProxy.ashx";
var getEpisodesURL = "http://192.168.1.19/webapp/EverStreamProxy.ashx?GetEpisodes&serieId={id}";
var EverStreamViewModel = function () {
    var self = this;

    // type de la page en cours d'affichage :
    // top detail searchresult ...
    this.pageType = ko.observable('top');

    this.pageStack = ko.observableArray();

    this.currentPage = ko.computed(function () {
        return self.pageStack().slice(0)[0];
    }, this);
    this.pageStack.unshift('top'); // .push('top');

    // liste top
    this.topserie = ko.observableArray([]);

    // liste série chargées pendant la session
    this.series = ko.observableArray([]);

    // série en cours
    this.serie = ko.observable({ title: 'sample', longDescription: 'sample description', posterURL: '' });

    // liste des épisodes de la série en cours
    this.episodes = ko.observableArray([]);

    // chargement de la liste des top séries
    // depuis le serveur ou depuis le localstorage
    this.loadTopSeries = function () {
        //alert('load top');
        var key = "topseries";
        //localStorage.removeItem(key);
        var item = localStorage.getItem(key);
        if (item == null) {
            // alert('not in cache, sending request');

            $.getJSON(topserieUrl, function (datas) {
                // alert('top loaded');
                localStorage.setItem(key, JSON.stringify(datas));
                self.topserie(datas.TopSeries);
                self.series(datas.Series);
            });
        }
        else {
            // alert('top in cache');
            var datas = JSON.parse(item);
            self.topserie(datas.TopSeries);
            self.series(datas.Series);
        }
    };

    this.loadEpisodeList = function (serie) 
    {
        $.getJSON(getEpisodesURL.format({ id: serie.serieId }), function (result) {
            //alert(result);
            self.episodes(result.Episodes);
        });
    };

    this.loadStreams = function (episode) {

    };

    this.onSerieClick = function (target) {
        // rechercher si la série est déja chargée en mémoire
        var match = ko.utils.arrayFirst(self.series(), function (item) { return item.id == target.serieId; });
        if (match) {
            // alert("found :" + match.title);
            self.episodes([]);
            self.loadEpisodeList(target);
            self.serie(match);
            self.pageStack.unshift('serie');
        }
    };

    // fonctions de navigation
    this.prevPage = function () {
        self.pageStack.shift(); //  ('top');
    };

    this.loadTopSeries();
    //alert( this.pageStack()[0] );

    //=======================
    // PROGRESS BAR BINDINGS
    //=======================
    this.progressMax = ko.observable(100);
    this.progressCurrent = ko.observable(70);




};

//var viewModel = new EverStreamViewModel();
//ko.applyBindings(viewModel);